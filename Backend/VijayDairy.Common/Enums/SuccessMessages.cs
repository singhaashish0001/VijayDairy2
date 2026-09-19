using System.ComponentModel;

namespace VijayDairy.Common.Enums;

/// <summary>
/// Success message enum used with ResponseModel to describe the outcome of an operation.
/// </summary>
public enum SuccessMessages
{
    [Description("Added successfully")]
    AddSuccess,

    [Description("Updated successfully")]
    UpdateSuccess,

    [Description("Deleted successfully")]
    DeleteSuccess,

    [Description("Logged out")]
    LogoutSuccess,
}
