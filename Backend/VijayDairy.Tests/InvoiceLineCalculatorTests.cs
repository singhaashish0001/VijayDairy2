using VijayDairy.Application.Helpers;
using VijayDairy.Application.Managements.InvoiceManagement.Commands.AddInvoice;
using Xunit;

namespace VijayDairy.Tests;

public class InvoiceLineCalculatorTests
{
    [Theory]
    [InlineData("LTR", 100, 2, 200)]
    [InlineData("KG", 80, 0.25, 20)]
    [InlineData("KG", 80, 1.25, 100)]
    [InlineData("LTR", 100, 2.75, 275)]
    [InlineData("PCS", 20, 5, 100)]
    public void QuantityMode_AmountIsQuantityTimesRate(string unit, decimal rate, decimal qty, decimal expectedAmount)
    {
        var r = InvoiceLineCalculator.Calculate(unit, rate, "QUANTITY", qty);
        Assert.True(r.Ok);
        Assert.Equal(qty, r.Quantity);
        Assert.Equal(expectedAmount, r.Amount);
        Assert.Equal("QUANTITY", r.SellingMode);
    }

    [Theory]
    [InlineData("LTR", 100, 150, 1.5)]
    [InlineData("KG", 80, 200, 2.5)]
    [InlineData("KG", 80, 100, 1.25)]
    public void AmountMode_QuantityIsAmountDividedByRate(string unit, decimal rate, decimal amount, decimal expectedQty)
    {
        var r = InvoiceLineCalculator.Calculate(unit, rate, "AMOUNT", amount);
        Assert.True(r.Ok);
        Assert.Equal(expectedQty, r.Quantity);
        Assert.Equal(amount, r.Amount);
        Assert.Equal("AMOUNT", r.SellingMode);
    }

    [Fact]
    public void AmountMode_KeepsEnteredAmountAndRoundsQuantityTo3Decimals()
    {
        var r = InvoiceLineCalculator.Calculate("LTR", 3, "AMOUNT", 100);
        Assert.True(r.Ok);
        Assert.Equal(33.333m, r.Quantity);
        Assert.Equal(100m, r.Amount); // the customer pays exactly what was entered
    }

    [Fact]
    public void Pcs_CannotBeSoldByAmount()
    {
        var r = InvoiceLineCalculator.Calculate("PCS", 20, "AMOUNT", 100);
        Assert.False(r.Ok);
        Assert.Equal("PCS products can only be sold by quantity.", r.Error);
    }

    [Fact]
    public void Pcs_RejectsFractionalQuantity()
    {
        var r = InvoiceLineCalculator.Calculate("PCS", 20, "QUANTITY", 1.5m);
        Assert.False(r.Ok);
        Assert.Equal("PCS quantity must be a whole number.", r.Error);
    }

    [Fact]
    public void AmountMode_ZeroRate_DoesNotDivideByZero()
    {
        var r = InvoiceLineCalculator.Calculate("KG", 0, "AMOUNT", 100);
        Assert.False(r.Ok);
        Assert.Equal("Rate must be greater than zero to calculate quantity.", r.Error);
    }

    [Fact]
    public void QuantityMode_ZeroRate_IsAllowedAndFree()
    {
        var r = InvoiceLineCalculator.Calculate("KG", 0, "QUANTITY", 2);
        Assert.True(r.Ok);
        Assert.Equal(0m, r.Amount);
    }

    [Theory]
    [InlineData("QUANTITY", -1, "Quantity cannot be negative.")]
    [InlineData("AMOUNT", -1, "Amount cannot be negative.")]
    [InlineData("QUANTITY", 0, "Please enter a valid quantity.")]
    [InlineData("AMOUNT", 0, "Please enter a valid amount.")]
    public void NegativeAndZeroValues_AreRejected(string mode, decimal value, string message)
    {
        var r = InvoiceLineCalculator.Calculate("KG", 80, mode, value);
        Assert.False(r.Ok);
        Assert.Equal(message, r.Error);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("garbage")]
    public void MissingOrUnknownMode_DefaultsToQuantity(string? mode)
    {
        var r = InvoiceLineCalculator.Calculate("LTR", 100, mode, 2);
        Assert.True(r.Ok);
        Assert.Equal("QUANTITY", r.SellingMode);
        Assert.Equal(200m, r.Amount);
    }

    [Fact]
    public void ModeIsCaseInsensitive()
    {
        var r = InvoiceLineCalculator.Calculate("LTR", 100, "amount", 150);
        Assert.Equal(1.5m, r.Quantity);
    }

    [Fact]
    public void AmountMode_TooSmallToBuyAnything_IsRejected()
    {
        var r = InvoiceLineCalculator.Calculate("KG", 100000, "AMOUNT", 0.01m);
        Assert.False(r.Ok);
    }

    [Fact]
    public void Validator_RejectsInconsistentPcsAmountItem()
    {
        var cmd = new AddInvoiceCommand
        {
            Items = { new AddInvoiceItemCommand { Name = "Chocolate", Unit = "PCS", Price = 20, SellingMode = "AMOUNT", Amount = 100 } },
        };
        var result = new AddInvoiceValidator().Validate(cmd);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("PCS products can only be sold by quantity."));
    }

    [Fact]
    public void Validator_AcceptsLegacyPayloadWithoutSellingMode()
    {
        var cmd = new AddInvoiceCommand
        {
            Items = { new AddInvoiceItemCommand { Name = "Milk", Unit = "LTR", Price = 100, Quantity = 2, Total = 200 } },
        };
        Assert.True(new AddInvoiceValidator().Validate(cmd).IsValid);
    }
}
