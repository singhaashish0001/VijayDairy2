using System;
using MediatR;
using VijayDairy.Domain.Models.Common;
using VijayDairy.Domain.Models.Invoice;
using VijayDairy.Domain.Models.Settings;

namespace VijayDairy.Application.Managements.InvoiceManagement.Queries.GetPublicInvoice;

public class PublicInvoiceVM
{
    public InvoiceVM Invoice { get; set; } = new();
    public PublicSettingsVM Settings { get; set; } = new();
}

public class GetPublicInvoiceQuery : IRequest<ResponseModel<PublicInvoiceVM>>
{
    public Guid Id { get; set; }
}
