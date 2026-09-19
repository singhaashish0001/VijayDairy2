using System.Data;
using System.Threading.Tasks;
using VijayDairy.Domain.Entities;
using VijayDairy.Persistence;

namespace VijayDairy.Postgres;

public class SettingsRepository : PostgresHelper, ISettingsRepository
{
    public SettingsRepository(string connectionString) : base(connectionString) { }

    private static BusinessSettings Map(IDataReader reader) => new()
    {
        Id = reader.GetString(reader.GetOrdinal("id")),
        ShopName = reader.GetString(reader.GetOrdinal("shop_name")),
        Address = reader.GetString(reader.GetOrdinal("address")),
        Phone = reader.GetString(reader.GetOrdinal("phone")),
        GstNumber = reader.GetString(reader.GetOrdinal("gst_number")),
        FooterNote = reader.GetString(reader.GetOrdinal("footer_note")),
        InventoryEnabled = reader.GetBoolean(reader.GetOrdinal("inventory_enabled")),
    };

    public Task<BusinessSettings> GetAsync()
    {
        const string sql = @"
            SELECT id, shop_name, address, phone, gst_number, footer_note, inventory_enabled
            FROM settings WHERE id = 'business'";
        using var reader = ExecuteDataReader(sql);
        return Task.FromResult(reader.Read() ? Map(reader) : new BusinessSettings());
    }

    public Task<BusinessSettings> UpsertAsync(BusinessSettings settings)
    {
        const string sql = @"
            INSERT INTO settings (id, shop_name, address, phone, gst_number, footer_note, inventory_enabled)
            VALUES ('business', @ShopName, @Address, @Phone, @GstNumber, @FooterNote, @InventoryEnabled)
            ON CONFLICT (id) DO UPDATE SET
                shop_name = EXCLUDED.shop_name,
                address = EXCLUDED.address,
                phone = EXCLUDED.phone,
                gst_number = EXCLUDED.gst_number,
                footer_note = EXCLUDED.footer_note,
                inventory_enabled = EXCLUDED.inventory_enabled
            RETURNING id, shop_name, address, phone, gst_number, footer_note, inventory_enabled";
        using var reader = ExecuteDataReader(sql, new[]
        {
            Param("@ShopName", settings.ShopName),
            Param("@Address", settings.Address),
            Param("@Phone", settings.Phone),
            Param("@GstNumber", settings.GstNumber),
            Param("@FooterNote", settings.FooterNote),
            Param("@InventoryEnabled", settings.InventoryEnabled),
        });
        reader.Read();
        return Task.FromResult(Map(reader));
    }
}
