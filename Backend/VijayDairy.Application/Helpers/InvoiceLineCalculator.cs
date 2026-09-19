using System;
using VijayDairy.Application.Managements.InvoiceManagement.Commands.AddInvoice;

namespace VijayDairy.Application.Helpers;

public static class SellingModes
{
    public const string Quantity = "QUANTITY";
    public const string Amount = "AMOUNT";
}

public record LineCalculation(bool Ok, decimal Quantity, decimal Amount, string SellingMode, string? Error);

/// <summary>
/// Single source of truth for invoice line maths. The rate is the anchor; whichever of quantity/amount the
/// user did NOT enter is always derived from it, so a line can never hold an inconsistent combination.
/// Mirrored by Frontend/src/helpers/line-item-calc.ts.
/// </summary>
public static class InvoiceLineCalculator
{
    public const int AmountDecimals = 2;

    public static bool SupportsAmountMode(string unit) =>
        unit.Equals("KG", StringComparison.OrdinalIgnoreCase) || unit.Equals("LTR", StringComparison.OrdinalIgnoreCase);

    public static int QuantityDecimals(string unit) =>
        unit.Equals("PCS", StringComparison.OrdinalIgnoreCase) ? 0 : 3;

    public static string NormalizeMode(string? mode) =>
        string.Equals(mode, SellingModes.Amount, StringComparison.OrdinalIgnoreCase) ? SellingModes.Amount : SellingModes.Quantity;

    /// <summary>The value the user typed for this line: the amount in AMOUNT mode, otherwise the quantity.</summary>
    public static decimal EnteredValue(AddInvoiceItemCommand item) =>
        NormalizeMode(item.SellingMode) == SellingModes.Amount ? item.Amount ?? 0 : item.Quantity;

    /// <param name="value">The quantity (QUANTITY mode) or the gross amount (AMOUNT mode) the user entered.</param>
    public static LineCalculation Calculate(string unit, decimal rate, string? sellingMode, decimal value)
    {
        var mode = NormalizeMode(sellingMode);
        var dp = QuantityDecimals(unit);

        LineCalculation Fail(string error) => new(false, 0, 0, mode, error);

        if (rate < 0) return Fail("Rate cannot be negative.");

        if (mode == SellingModes.Amount)
        {
            if (!SupportsAmountMode(unit)) return Fail("PCS products can only be sold by quantity.");
            if (value < 0) return Fail("Amount cannot be negative.");
            if (value == 0) return Fail("Please enter a valid amount.");
            if (rate == 0) return Fail("Rate must be greater than zero to calculate quantity.");

            var quantity = Math.Round(value / rate, dp, MidpointRounding.AwayFromZero);
            if (quantity <= 0) return Fail("Please enter a valid amount.");
            return new(true, quantity, Math.Round(value, AmountDecimals, MidpointRounding.AwayFromZero), mode, null);
        }

        if (value < 0) return Fail("Quantity cannot be negative.");
        if (value == 0) return Fail("Please enter a valid quantity.");
        if (dp == 0 && value != Math.Truncate(value)) return Fail("PCS quantity must be a whole number.");

        var qty = Math.Round(value, dp, MidpointRounding.AwayFromZero);
        if (qty <= 0) return Fail("Please enter a valid quantity.");
        return new(true, qty, Math.Round(qty * rate, AmountDecimals, MidpointRounding.AwayFromZero), mode, null);
    }
}
