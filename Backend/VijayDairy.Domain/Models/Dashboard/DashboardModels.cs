using System;
using System.Collections.Generic;

namespace VijayDairy.Domain.Models.Dashboard;

public class MonthPointVM
{
    public string Month { get; set; } = "";
    public decimal Revenue { get; set; }
}

public class DayPointVM
{
    public string Date { get; set; } = "";
    public decimal Revenue { get; set; }
}

public class TopProductVM
{
    public string Name { get; set; } = "";
    public decimal Quantity { get; set; }
    public decimal Revenue { get; set; }
}

public class UnitSalesVM
{
    public string Unit { get; set; } = "";
    public decimal Revenue { get; set; }
}

public class RecentInvoiceVM
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = "";
    public decimal Total { get; set; }
    public int ItemsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class LowStockProductVM
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Stock { get; set; }
    public decimal LowStockThreshold { get; set; }
    public string Unit { get; set; } = "";
}

public class DashboardStatsVM
{
    public decimal TotalRevenue { get; set; }
    public decimal MonthRevenue { get; set; }
    public decimal TodayRevenue { get; set; }
    public decimal WeekRevenue { get; set; }
    public decimal WowChange { get; set; }
    public int InvoiceCount { get; set; }
    public List<MonthPointVM> MonthlySeries { get; set; } = new();
    public List<DayPointVM> DailySeries { get; set; } = new();
    public List<TopProductVM> TopProducts { get; set; } = new();
    public List<UnitSalesVM> SalesByUnit { get; set; } = new();
    public List<RecentInvoiceVM> RecentInvoices { get; set; } = new();
    public bool InventoryEnabled { get; set; }
    public List<LowStockProductVM> LowStockProducts { get; set; } = new();
}
