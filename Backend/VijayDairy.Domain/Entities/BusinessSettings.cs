namespace VijayDairy.Domain.Entities;

public class BusinessSettings
{
    public string Id { get; set; } = "business";
    public string ShopName { get; set; } = "Vijay Dairy";
    public string Address { get; set; } = "";
    public string Phone { get; set; } = "";
    public string GstNumber { get; set; } = "";
    public string FooterNote { get; set; } = "Thank you for your business!";
    public bool InventoryEnabled { get; set; } = false;
}
