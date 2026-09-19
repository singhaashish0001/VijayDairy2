using System;
using System.ComponentModel;

namespace VijayDairy.Common.Utility;

public static class EnumExtensions
{
    /// <summary>
    /// Returns the [Description] attribute text for an enum value, falling back to
    /// the enum member name when no attribute is present.
    /// </summary>
    public static string GetEnumDescription(this Enum enumValue)
    {
        var fieldInfo = enumValue.GetType().GetField(enumValue.ToString());
        if (fieldInfo is null) return enumValue.ToString();

        var descriptionAttributes = (DescriptionAttribute[])fieldInfo.GetCustomAttributes(typeof(DescriptionAttribute), false);
        return descriptionAttributes.Length > 0 ? descriptionAttributes[0].Description : enumValue.ToString();
    }
}
