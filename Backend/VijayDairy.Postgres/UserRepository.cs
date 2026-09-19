using System;
using System.Threading.Tasks;
using VijayDairy.Domain.Entities;
using VijayDairy.Persistence;

namespace VijayDairy.Postgres;

public class UserRepository : PostgresHelper, IUserRepository
{
    public UserRepository(string connectionString) : base(connectionString) { }

    private static User Map(System.Data.IDataReader reader) => new()
    {
        Id = reader.GetGuid(reader.GetOrdinal("id")),
        Email = reader.GetString(reader.GetOrdinal("email")),
        PasswordHash = reader.GetString(reader.GetOrdinal("password_hash")),
        Name = reader.GetString(reader.GetOrdinal("name")),
        Role = reader.GetString(reader.GetOrdinal("role")),
        CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at")),
    };

    public Task<User?> GetByEmailAsync(string email)
    {
        const string sql = "SELECT id, email, password_hash, name, role, created_at FROM users WHERE LOWER(email) = LOWER(@Email)";
        using var reader = ExecuteDataReader(sql, new[] { Param("@Email", email) });
        return Task.FromResult(reader.Read() ? Map(reader) : null);
    }

    public Task<User?> GetByIdAsync(Guid id)
    {
        const string sql = "SELECT id, email, password_hash, name, role, created_at FROM users WHERE id = @Id";
        using var reader = ExecuteDataReader(sql, new[] { Param("@Id", id) });
        return Task.FromResult(reader.Read() ? Map(reader) : null);
    }

    public Task<User> CreateAsync(User user)
    {
        const string sql = @"
            INSERT INTO users (email, password_hash, name, role)
            VALUES (@Email, @PasswordHash, @Name, @Role)
            RETURNING id, email, password_hash, name, role, created_at";
        using var reader = ExecuteDataReader(sql, new[]
        {
            Param("@Email", user.Email),
            Param("@PasswordHash", user.PasswordHash),
            Param("@Name", user.Name),
            Param("@Role", user.Role),
        });
        reader.Read();
        return Task.FromResult(Map(reader));
    }
}
