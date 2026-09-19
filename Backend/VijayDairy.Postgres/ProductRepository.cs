using System;
using System.Collections.Generic;
using System.Data;
using System.Text;
using System.Threading.Tasks;
using VijayDairy.Domain.Entities;
using VijayDairy.Persistence;

namespace VijayDairy.Postgres;

public class ProductRepository : PostgresHelper, IProductRepository
{
    public ProductRepository(string connectionString) : base(connectionString) { }

    private static Product Map(IDataReader reader) => new()
    {
        Id = reader.GetGuid(reader.GetOrdinal("id")),
        Name = reader.GetString(reader.GetOrdinal("name")),
        Unit = reader.GetString(reader.GetOrdinal("unit")),
        Price = reader.GetDecimal(reader.GetOrdinal("price")),
        Stock = reader.GetDecimal(reader.GetOrdinal("stock")),
        LowStockThreshold = reader.GetDecimal(reader.GetOrdinal("low_stock_threshold")),
        CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at")),
    };

    public Task<List<Product>> GetAllAsync()
    {
        const string sql = @"
            SELECT id, name, unit, price, stock, low_stock_threshold, created_at
            FROM products ORDER BY name ASC LIMIT 1000";
        using var reader = ExecuteDataReader(sql);
        var results = new List<Product>();
        while (reader.Read()) results.Add(Map(reader));
        return Task.FromResult(results);
    }

    public Task<Product?> GetByIdAsync(Guid id)
    {
        const string sql = @"
            SELECT id, name, unit, price, stock, low_stock_threshold, created_at
            FROM products WHERE id = @Id";
        using var reader = ExecuteDataReader(sql, new[] { Param("@Id", id) });
        return Task.FromResult(reader.Read() ? Map(reader) : null);
    }

    public Task<Product?> GetByNameAsync(string name)
    {
        const string sql = @"
            SELECT id, name, unit, price, stock, low_stock_threshold, created_at
            FROM products WHERE LOWER(name) = LOWER(@Name)";
        using var reader = ExecuteDataReader(sql, new[] { Param("@Name", name) });
        return Task.FromResult(reader.Read() ? Map(reader) : null);
    }

    public Task<Product> CreateAsync(Product product)
    {
        const string sql = @"
            INSERT INTO products (name, unit, price, stock, low_stock_threshold)
            VALUES (@Name, @Unit, @Price, @Stock, @Threshold)
            RETURNING id, name, unit, price, stock, low_stock_threshold, created_at";
        using var reader = ExecuteDataReader(sql, new[]
        {
            Param("@Name", product.Name),
            Param("@Unit", product.Unit),
            Param("@Price", product.Price),
            Param("@Stock", product.Stock),
            Param("@Threshold", product.LowStockThreshold),
        });
        reader.Read();
        return Task.FromResult(Map(reader));
    }

    public Task<Product?> UpdateAsync(Guid id, Product patch, HashSet<string> fieldsToUpdate)
    {
        var sets = new List<string>();
        var npgsqlParams = new List<Npgsql.NpgsqlParameter>();

        if (fieldsToUpdate.Contains("name")) { sets.Add("name = @Name"); npgsqlParams.Add(Param("@Name", patch.Name)); }
        if (fieldsToUpdate.Contains("unit")) { sets.Add("unit = @Unit"); npgsqlParams.Add(Param("@Unit", patch.Unit)); }
        if (fieldsToUpdate.Contains("price")) { sets.Add("price = @Price"); npgsqlParams.Add(Param("@Price", patch.Price)); }
        if (fieldsToUpdate.Contains("stock")) { sets.Add("stock = @Stock"); npgsqlParams.Add(Param("@Stock", patch.Stock)); }
        if (fieldsToUpdate.Contains("lowStockThreshold")) { sets.Add("low_stock_threshold = @Threshold"); npgsqlParams.Add(Param("@Threshold", patch.LowStockThreshold)); }

        var sql = new StringBuilder("UPDATE products SET ")
            .Append(string.Join(", ", sets))
            .Append(" WHERE id = @Id RETURNING id, name, unit, price, stock, low_stock_threshold, created_at");

        npgsqlParams.Add(Param("@Id", id));

        using var reader = ExecuteDataReader(sql.ToString(), npgsqlParams);
        return Task.FromResult(reader.Read() ? Map(reader) : null);
    }

    public Task<bool> DeleteAsync(Guid id)
    {
        const string sql = "DELETE FROM products WHERE id = @Id";
        var rows = ExecuteNonQuery(sql, new[] { Param("@Id", id) });
        return Task.FromResult(rows > 0);
    }

    public Task<List<Product>> GetLowStockAsync(int limit)
    {
        const string sql = @"
            SELECT id, name, unit, price, stock, low_stock_threshold, created_at
            FROM products
            WHERE low_stock_threshold > 0 AND stock <= low_stock_threshold
            ORDER BY stock ASC LIMIT @Limit";
        using var reader = ExecuteDataReader(sql, new[] { Param("@Limit", limit) });
        var results = new List<Product>();
        while (reader.Read()) results.Add(Map(reader));
        return Task.FromResult(results);
    }
}
