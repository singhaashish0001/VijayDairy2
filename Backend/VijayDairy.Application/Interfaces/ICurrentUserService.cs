using System;

namespace VijayDairy.Application.Interfaces;

/// <summary>Resolves the authenticated user's id from the current HTTP context's JWT claims.</summary>
public interface ICurrentUserService
{
    Guid GetUserId();
}
