namespace VijayDairy.Domain.Models.Common;

/// <summary>
/// Envelope returned by every MediatR handler. Error/StatusCode/MessageId/MessageText
/// mirror the failure shape so ASP.NET can serialize handler results directly;
/// the exception-mapping middleware produces the same shape for thrown exceptions.
/// </summary>
public class ResponseModel<T>
{
    public bool Error { get; set; }
    public int StatusCode { get; set; }
    public string MessageId { get; set; } = "";
    public string MessageText { get; set; } = "";
    public T? Data { get; set; }
}

public class ResponseModel
{
    public bool Error { get; set; }
    public int StatusCode { get; set; }
    public string MessageId { get; set; } = "";
    public string MessageText { get; set; } = "";
}
