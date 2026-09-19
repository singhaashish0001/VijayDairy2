using System.ComponentModel;

namespace VijayDairy.Common.Enums;

/// <summary>
/// Error message enum used with ResponseModel to describe what type of error occurred.
/// </summary>
public enum ErrorMessages
{
    [Description("Unauthorized")]
    Unauthorized,

    [Description("Record Not Found")]
    RecordNotFound,

    [Description("Something Went Wrong")]
    SomethingWentWrong,

    [Description("Invalid Email Or Password")]
    InvalidEmailOrPassword,

    [Description("Name Not Available")]
    NameNotAvailable,

    [Description("Invalid Request")]
    InvalidRequest,

    [Description("No Fields To Update")]
    NoFieldsToUpdate,

    [Description("Invalid File")]
    InvalidFile,
}
