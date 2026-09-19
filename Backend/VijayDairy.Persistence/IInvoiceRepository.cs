using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VijayDairy.Domain.Entities;

namespace VijayDairy.Persistence;

public interface IInvoiceRepository
{
    Task<List<Invoice>> GetAllAsync();
    Task<Invoice?> GetByIdAsync(Guid id);
    Task<bool> DeleteAsync(Guid id);

    /// <summary>
    /// Atomically allocates the next invoice sequence number, inserts the invoice, and
    /// (when <paramref name="decrementStock"/> is true) decrements matching product stock —
    /// all inside a single database transaction.
    /// </summary>
    Task<Invoice> CreateAsync(Invoice invoice, bool decrementStock);
}
