using System.IO;
using System.Text;
using VijayDairy.Application.Managements.ProductManagement.Commands.ImportStock;
using VijayDairy.Domain.Entities;
using VijayDairy.Persistence;
using Xunit;

namespace VijayDairy.Tests;

public class ImportStockHandlerTests
{
    private class FakeProductRepository : IProductRepository
    {
        public List<Product> Products { get; } = new();
        public int CreateCalls { get; private set; }

        public Task<List<Product>> GetAllAsync() => Task.FromResult(Products.ToList());
        public Task<Product?> GetByIdAsync(Guid id) => Task.FromResult(Products.FirstOrDefault(p => p.Id == id));
        public Task<Product?> GetByNameAsync(string name) =>
            Task.FromResult(Products.FirstOrDefault(p => p.Name.Equals(name, StringComparison.OrdinalIgnoreCase)));
        public Task<Product> CreateAsync(Product product) { CreateCalls++; Products.Add(product); return Task.FromResult(product); }
        public Task<bool> DeleteAsync(Guid id) => Task.FromResult(true);
        public Task<List<Product>> GetLowStockAsync(int limit) => Task.FromResult(new List<Product>());
        public Task<Product?> UpdateAsync(Guid id, Product patch, HashSet<string> fieldsToUpdate)
        {
            var p = Products.First(x => x.Id == id);
            if (fieldsToUpdate.Contains("stock")) p.Stock = patch.Stock;
            if (fieldsToUpdate.Contains("lowStockThreshold")) p.LowStockThreshold = patch.LowStockThreshold;
            // The importer must never touch these:
            Assert.DoesNotContain("price", fieldsToUpdate);
            Assert.DoesNotContain("unit", fieldsToUpdate);
            Assert.DoesNotContain("name", fieldsToUpdate);
            return Task.FromResult<Product?>(p);
        }
    }

    private static FakeProductRepository Repo() => new()
    {
        Products =
        {
            new Product { Id = Guid.NewGuid(), Name = "A2 Cow Milk", Unit = "LTR", Price = 96, Stock = 10, LowStockThreshold = 5 },
            new Product { Id = Guid.NewGuid(), Name = "Paneer", Unit = "KG", Price = 420, Stock = 3, LowStockThreshold = 2 },
        },
    };

    private static async Task<Domain.Models.Product.BulkImportResultVM> Run(FakeProductRepository repo, string csv, string? mode = null)
    {
        var handler = new ImportStockHandler(repo);
        var res = await handler.Handle(new ImportStockCommand { FileStream = new MemoryStream(Encoding.UTF8.GetBytes(csv)), Mode = mode }, CancellationToken.None);
        return res.Data!;
    }

    [Fact]
    public async Task Set_ReplacesStock_AndLeavesPriceUnitAlone()
    {
        var repo = Repo();
        var r = await Run(repo, "name,stock\nA2 Cow Milk,25\nPaneer,7.5\n", "SET");
        Assert.Equal(2, r.Updated);
        Assert.Empty(r.Errors);
        Assert.Equal(25m, repo.Products[0].Stock);
        Assert.Equal(7.5m, repo.Products[1].Stock);
        Assert.Equal(96m, repo.Products[0].Price);
    }

    [Fact]
    public async Task Add_AddsToCurrentStock()
    {
        var repo = Repo();
        await Run(repo, "name,stock\nA2 Cow Milk,5\nPaneer,-1\n", "add");
        Assert.Equal(15m, repo.Products[0].Stock);
        Assert.Equal(2m, repo.Products[1].Stock);
    }

    [Fact]
    public async Task Add_RejectsRowThatWouldGoNegative()
    {
        var repo = Repo();
        var r = await Run(repo, "name,stock\nPaneer,-10\n", "ADD");
        Assert.Equal(0, r.Updated);
        Assert.Single(r.Errors);
        Assert.Equal(3m, repo.Products[1].Stock);
    }

    [Fact]
    public async Task UnknownProduct_IsReported_AndNeverCreated()
    {
        var repo = Repo();
        var r = await Run(repo, "name,stock\nGhee,4\n");
        Assert.Equal(0, r.Updated);
        Assert.Contains("not found", r.Errors[0].Error);
        Assert.Equal(0, repo.CreateCalls);
        Assert.Equal(2, repo.Products.Count);
    }

    [Fact]
    public async Task NameMatch_IsCaseInsensitive()
    {
        var repo = Repo();
        var r = await Run(repo, "name,stock\na2 cow milk,1\n");
        Assert.Equal(1, r.Updated);
    }

    [Fact]
    public async Task Threshold_WhenColumnPresent_BlankMeansZero()
    {
        var repo = Repo();
        await Run(repo, "name,stock,low_stock_threshold\nA2 Cow Milk,20,\nPaneer,9,4\n");
        Assert.Equal(0m, repo.Products[0].LowStockThreshold);
        Assert.Equal(4m, repo.Products[1].LowStockThreshold);
    }

    [Fact]
    public async Task Threshold_WhenColumnAbsent_IsUntouched()
    {
        var repo = Repo();
        await Run(repo, "name,stock\nA2 Cow Milk,20\n");
        Assert.Equal(5m, repo.Products[0].LowStockThreshold);
    }

    [Fact]
    public async Task InvalidValues_AreRowErrors_AndGoodRowsStillApply()
    {
        var repo = Repo();
        var r = await Run(repo, "name,stock,low_stock_threshold\nA2 Cow Milk,abc,\nPaneer,8,-2\n,3,\nPaneer,6,1\n");
        Assert.Equal(3, r.Errors.Count);
        Assert.Equal(1, r.Updated);
        Assert.Equal(9m, repo.Products[1].Stock); // 3 (present) + 6 (default mode adds)
    }

    [Fact]
    public async Task MissingRequiredColumn_Throws()
    {
        var repo = Repo();
        await Assert.ThrowsAsync<VijayDairy.Common.Exceptions.ValidationException>(() => Run(repo, "name,qty\nPaneer,3\n"));
    }

    [Fact]
    public async Task QuotedNamesAndBom_AreHandled()
    {
        var repo = Repo();
        repo.Products.Add(new Product { Id = Guid.NewGuid(), Name = "Ghee, Desi", Unit = "KG", Price = 650, Stock = 0 });
        var r = await Run(repo, "﻿name,stock\n\"Ghee, Desi\",12\n");
        Assert.Equal(1, r.Updated);
        Assert.Equal(12m, repo.Products[2].Stock);
    }

    [Theory]
    [InlineData(";")]
    [InlineData("\t")] // Excel "Text (Tab delimited)" saved with a .csv extension
    public async Task ExcelDelimiters_SemicolonAndTab_AreAutoDetected(string d)
    {
        var repo = Repo();
        var csv = $"name{d}stock{d}low_stock_threshold\r\nA2 Cow Milk{d}40{d}\r\nPaneer{d}9{d}3\r\n";
        var r = await Run(repo, csv, "SET");
        Assert.Equal(2, r.Updated);
        Assert.Empty(r.Errors);
        Assert.Equal(40m, repo.Products[0].Stock);
        Assert.Equal(0m, repo.Products[0].LowStockThreshold);
        Assert.Equal(3m, repo.Products[1].LowStockThreshold);
    }

    [Fact]
    public async Task ExcelTrailingBlankRows_AreIgnored_NotReportedAsErrors()
    {
        var repo = Repo();
        var r = await Run(repo, "name,stock,,\nA2 Cow Milk,20,,\n,,,\n , ,,\n");
        Assert.Equal(1, r.Updated);
        Assert.Empty(r.Errors);
    }

    [Fact]
    public async Task MissingColumnError_ListsTheColumnsThatWereFound()
    {
        var repo = Repo();
        var ex = await Assert.ThrowsAsync<VijayDairy.Common.Exceptions.ValidationException>(() => Run(repo, "Product;Quantity\nPaneer;3\n"));
        Assert.Contains("Found columns: product | quantity", ex.Message);
    }

    [Fact]
    public async Task NoMode_DefaultsToAddingToPresentStock()
    {
        var repo = Repo();
        var r = await Run(repo, "name,stock\nA2 Cow Milk,5\nPaneer,2\n");
        Assert.Equal(2, r.Updated);
        Assert.Equal(15m, repo.Products[0].Stock); // 10 + 5
        Assert.Equal(5m, repo.Products[1].Stock);  // 3 + 2
    }
}
