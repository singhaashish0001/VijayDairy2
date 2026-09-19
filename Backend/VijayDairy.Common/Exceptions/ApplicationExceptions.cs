using System;

namespace VijayDairy.Common.Exceptions;

/// <summary>401 Unauthorized.</summary>
public class UnauthorizedException : Exception
{
    public string MessageText { get; }
    public UnauthorizedException(string message, string messageText = "") : base(message) => MessageText = messageText;
}

/// <summary>400 Bad Request — request failed validation.</summary>
public class ValidationException : Exception
{
    public string MessageText { get; }
    public ValidationException(string message, string messageText = "") : base(message) => MessageText = messageText;
}

/// <summary>401 Unauthorized — login credentials did not match.</summary>
public class InvalidEmailOrPasswordException : Exception
{
    public string MessageText { get; }
    public InvalidEmailOrPasswordException(string message, string messageText = "") : base(message) => MessageText = messageText;
}

/// <summary>404 Not Found.</summary>
public class NotFoundException : Exception
{
    public string MessageText { get; }
    public NotFoundException(string message, string messageText = "") : base(message) => MessageText = messageText;
}

/// <summary>409 Conflict — a resource with the same identity already exists.</summary>
public class DuplicateResourceException : Exception
{
    public string MessageText { get; }
    public DuplicateResourceException(string message, string messageText = "") : base(message) => MessageText = messageText;
}

/// <summary>500 Internal Server Error.</summary>
public class InternalServerException : Exception
{
    public string MessageText { get; }
    public InternalServerException(string message, string messageText = "") : base(message) => MessageText = messageText;
}
