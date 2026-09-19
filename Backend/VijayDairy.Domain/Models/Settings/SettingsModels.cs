namespace VijayDairy.Domain.Models.Settings;

public class SettingsVM
{
    public string Id { get; set; } = "business";
    public string ShopName { get; set; } = "";
    public string Address { get; set; } = "";
    public string Phone { get; set; } = "";
    public string GstNumber { get; set; } = "";
    public string FooterNote { get; set; } = "";
    public bool InventoryEnabled { get; set; }
}

/// <summary>Subset of SettingsVM exposed on the unauthenticated public-invoice endpoint — omits InventoryEnabled.</summary>
public class PublicSettingsVM
{
    public string ShopName { get; set; } = "";
    public string Address { get; set; } = "";
    public string Phone { get; set; } = "";
    public string GstNumber { get; set; } = "";
    public string FooterNote { get; set; } = "";
}
