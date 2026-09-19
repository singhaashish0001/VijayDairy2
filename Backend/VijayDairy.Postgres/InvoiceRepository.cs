using System;
using System.Collections.Generic;
using System.Data;
using System.Text.Json;
using System.Threading.Tasks;
using VijayDairy.Domain.Entities;
using VijayDairy.Persistence;

namespace VijayDairy.Postgres;

public class InvoiceRepository : PostgresHelper, IInvoiceRepository
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    public InvoiceRepository(string connectionString) : base(connectionString) { }

    private static Invoice Map(IDataReader reader) => new()
    {
        Id = reader.GetGuid(reader.GetOrdinal("id")),
        InvoiceNumber = reader.GetString(reader.GetOrdinal("invoice_number")),
        Items = JsonSerializer.Deserialize<List<InvoiceItem>>(reader.GetString(reader.GetOrdinal("items")), JsonOpts) ?? new(),
        Subtotal = reader.GetDecimal(reader.GetOrdinal("subtotal")),
        Discount = reader.GetDecimal(reader.GetOrdinal("discount")),
        TaxPercent = reader.GetDecimal(reader.GetOrdinal("tax_percent")),
        TaxAmount = reader.GetDecimal(reader.GetOrdinal("tax_amount")),
        Total = reader.GetDecimal(reader.GetOrdinal("total")),
        Notes = reader.GetString(reader.GetOrdinal("notes")),
        CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at")),
    };

    private const string SelectColumns =
        "id, invoice_number, items::text AS items, subtotal, discount, tax_percent, tax_amount, total, notes, created_at";

    public Task<List<Invoice>> GetAllAsync()
    {
        string sql = $"SELECT {SelectColumns} FROM invoices ORDER BY created_at DESC LIMIT 1000";
        using var reader = ExecuteDataReader(sql);
        var results = new List<Invoice>();
        while (reader.Read()) results.Add(Map(reader));
        return Task.FromResult(results);
    }

    public Task<Invoice?> GetByIdAsync(Guid id)
    {
        string sql = $"SELECT {SelectColumns} FROM invoices WHERE id = @Id";
        using var reader = ExecuteDataReader(sql, new[] { Param("@Id", id) });
        return Task.FromResult(reader.Read() ? Map(reader) : null);
    }

    public Task<bool> DeleteAsync(Guid id)
    {
        var rows = ExecuteNonQuery("DELETE FROM invoices WHERE id = @Id", new[] { Param("@Id", id) });
        return Task.FromResult(rows > 0);
    }

    public async Task<Invoice> CreateAsync(Invoice invoice, bool decrementStock)
    {
        using var connection = CreateAndOpenConnection();
        using var transaction = await connection.BeginTransactionAsync();
        try
        {
            using var seqCommand = CreateCommand(connection, "UPDATE counters SET seq = seq + 1 WHERE id = 'invoice' RETURNING seq");
            seqCommand.Transaction = transaction;
            var seq = (int)(await seqCommand.ExecuteScalarAsync())!;

            invoice.InvoiceNumber = $"VD-{DateTime.UtcNow:yyyyMM}-{seq:D4}";
            var itemsJson = JsonSerializer.Serialize(invoice.Items, JsonOpts);

            string insertSql = $@"
                INSERT INTO invoices (invoice_number, items, subtotal, discount, tax_percent, tax_amount, total, notes)
                VALUES (@InvoiceNumber, @Items::jsonb, @Subtotal, @Discount, @TaxPercent, @TaxAmount, @Total, @Notes)
                RETURNING {SelectColumns}";

            using var insertCommand = CreateCommand(connection, insertSql, new[]
            {
                Param("@InvoiceNumber", invoice.InvoiceNumber),
                Param("@Items", itemsJson),
                Param("@Subtotal", invoice.Subtotal),
                Param("@Discount", invoice.Discount),
                Param("@TaxPercent", invoice.TaxPercent),
                Param("@TaxAmount", invoice.TaxAmount),
                Param("@Total", invoice.Total),
                Param("@Notes", invoice.Notes),
            });
            insertCommand.Transaction = transaction;

            using var reader = await insertCommand.ExecuteReaderAsync();
            await reader.ReadAsync();
            var created = Map(reader);
            reader.Close();

            if (decrementStock)
            {
                foreach (var item in invoice.Items)
                {
                    if (Guid.TryParse(item.ProductId, out var productId))
                    {
                        using var stockCommand = CreateCommand(connection, "UPDATE products SET stock = stock - @Qty WHERE id = @Id", new[]
                        {
                            Param("@Qty", item.Quantity),
                            Param("@Id", productId),
                        });
                        stockCommand.Transaction = transaction;
                        await stockCommand.ExecuteNonQueryAsync();
                    }
                }
            }

            await transaction.CommitAsync();
            return created;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
