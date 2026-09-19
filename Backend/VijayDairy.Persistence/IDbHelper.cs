using System.Collections.Generic;
using System.Data;

namespace VijayDairy.Persistence;

/// <summary>
/// Raw ADO.NET database access contract — no ORM. Implemented by PostgresHelper
/// in VijayDairy.Postgres, using Npgsql directly.
/// </summary>
public interface IDbHelper
{
    IDataReader ExecuteDataReader(string commandText, IEnumerable<IDataParameter>? commandParameters = null);
    object? ExecuteScalar(string commandText, IEnumerable<IDataParameter>? commandParameters = null);
    int ExecuteNonQuery(string commandText, IEnumerable<IDataParameter>? commandParameters = null);
    string GetConnectionString();
}
