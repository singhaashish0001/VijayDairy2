using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Dashboard;
using VijayDairy.Persistence;

namespace VijayDairy.Application.Managements.DashboardManagement.Queries.GetDashboardStats;

public class GetDashboardStatsHandler : IRequestHandler<GetDashboardStatsQuery, ResponseModel<DashboardStatsVM>>
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IProductRepository _productRepository;
    private readonly ISettingsRepository _settingsRepository;

    public GetDashboardStatsHandler(IInvoiceRepository invoiceRepository, IProductRepository productRepository, ISettingsRepository settingsRepository)
    {
        _invoiceRepository = invoiceRepository;
        _productRepository = productRepository;
        _settingsRepository = settingsRepository;
    }

    public async Task<ResponseModel<DashboardStatsVM>> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var invoices = await _invoiceRepository.GetAllAsync();
        var settings = await _settingsRepository.GetAsync();

        var now = DateTime.UtcNow;
        var today = now.Date;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        int diffToMonday = ((int)now.DayOfWeek + 6) % 7;
        var weekStart = today.AddDays(-diffToMonday);
        var prevWeekStart = weekStart.AddDays(-7);
        var prevWeekEnd = weekStart;

        decimal totalRevenue = invoices.Sum(i => i.Total);
        decimal monthRevenue = invoices.Where(i => i.CreatedAt >= monthStart).Sum(i => i.Total);
        decimal todayRevenue = invoices.Where(i => i.CreatedAt >= today).Sum(i => i.Total);
        decimal weekRevenue = invoices.Where(i => i.CreatedAt >= weekStart).Sum(i => i.Total);
        decimal prevWeekRevenue = invoices.Where(i => i.CreatedAt >= prevWeekStart && i.CreatedAt < prevWeekEnd).Sum(i => i.Total);

        decimal wowChange = prevWeekRevenue == 0
            ? (weekRevenue > 0 ? 100m : 0m)
            : Math.Round(((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100m, 2);

        var monthlySeries = new System.Collections.Generic.List<MonthPointVM>();
        for (int i = 11; i >= 0; i--)
        {
            var bucketStart = monthStart.AddMonths(-i);
            var bucketEnd = bucketStart.AddMonths(1);
            var revenue = invoices.Where(inv => inv.CreatedAt >= bucketStart && inv.CreatedAt < bucketEnd).Sum(inv => inv.Total);
            monthlySeries.Add(new MonthPointVM { Month = bucketStart.ToString("yyyy-MM"), Revenue = Math.Round(revenue, 2) });
        }

        var dailySeries = new System.Collections.Generic.List<DayPointVM>();
        for (int i = 29; i >= 0; i--)
        {
            var bucketStart = today.AddDays(-i);
            var bucketEnd = bucketStart.AddDays(1);
            var revenue = invoices.Where(inv => inv.CreatedAt >= bucketStart && inv.CreatedAt < bucketEnd).Sum(inv => inv.Total);
            dailySeries.Add(new DayPointVM { Date = bucketStart.ToString("yyyy-MM-dd"), Revenue = Math.Round(revenue, 2) });
        }

        var allItems = invoices.SelectMany(i => i.Items).ToList();

        var topProducts = allItems
            .GroupBy(i => i.Name)
            .Select(g => new TopProductVM { Name = g.Key, Quantity = g.Sum(i => i.Quantity), Revenue = Math.Round(g.Sum(i => i.Total), 2) })
            .OrderByDescending(p => p.Revenue)
            .Take(5)
            .ToList();

        var salesByUnit = allItems
            .GroupBy(i => i.Unit)
            .Select(g => new UnitSalesVM { Unit = g.Key, Revenue = Math.Round(g.Sum(i => i.Total), 2) })
            .OrderByDescending(u => u.Revenue)
            .ToList();

        var recentInvoices = invoices.Take(5)
            .Select(i => new RecentInvoiceVM { Id = i.Id, InvoiceNumber = i.InvoiceNumber, Total = i.Total, ItemsCount = i.Items.Count, CreatedAt = i.CreatedAt })
            .ToList();

        var lowStock = new System.Collections.Generic.List<LowStockProductVM>();
        if (settings.InventoryEnabled)
        {
            var lowStockProducts = await _productRepository.GetLowStockAsync(10);
            lowStock = lowStockProducts
                .Select(p => new LowStockProductVM { Id = p.Id, Name = p.Name, Stock = p.Stock, LowStockThreshold = p.LowStockThreshold, Unit = p.Unit })
                .ToList();
        }

        var data = new DashboardStatsVM
        {
            TotalRevenue = Math.Round(totalRevenue, 2),
            MonthRevenue = Math.Round(monthRevenue, 2),
            TodayRevenue = Math.Round(todayRevenue, 2),
            WeekRevenue = Math.Round(weekRevenue, 2),
            WowChange = wowChange,
            InvoiceCount = invoices.Count,
            MonthlySeries = monthlySeries,
            DailySeries = dailySeries,
            TopProducts = topProducts,
            SalesByUnit = salesByUnit,
            RecentInvoices = recentInvoices,
            InventoryEnabled = settings.InventoryEnabled,
            LowStockProducts = lowStock,
        };

        return new ResponseModel<DashboardStatsVM> { Error = false, StatusCode = 200, Data = data };
    }
}
