using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VijayDairy.Domain.Entities;

namespace VijayDairy.Persistence;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(Guid id);
    Task<Product?> GetByNameAsync(string name);
    Task<Product> CreateAsync(Product product);
    Task<Product?> UpdateAsync(Guid id, Product patch, HashSet<string> fieldsToUpdate);
    Task<bool> DeleteAsync(Guid id);
    Task<List<Product>> GetLowStockAsync(int limit);
}
