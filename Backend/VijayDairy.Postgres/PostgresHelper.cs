using System.Collections.Generic;
using System.Data;
using System.Linq;
using Npgsql;
using VijayDairy.Persistence;

namespace VijayDairy.Postgres;

/// <summary>
/// Raw ADO.NET access to PostgreSQL via Npgsql — no ORM, no EF. Every repository in
/// this project extends this class and builds its own SQL/NpgsqlParameter arrays.
/// </summary>
public abstract class PostgresHelper : IDbHelper
{
    private readonly string _connectionString;

    protected PostgresHelper(string connectionString)
    {
        _connectionString = connectionString;
    }

    public string GetConnectionString() => _connectionString;

    public NpgsqlConnection CreateAndOpenConnection()
    {
        var connection = new NpgsqlConnection(_connectionString);
        connection.Open();
        return connection;
    }

    public NpgsqlCommand CreateCommand(NpgsqlConnection connection, string text, IEnumerable<IDataParameter>? commandParameters = null)
    {
        var command = connection.CreateCommand();
        command.CommandType = CommandType.Text;
        command.CommandText = text;
        if (commandParameters != null)
        {
            command.Parameters.AddRange(commandParameters.Cast<NpgsqlParameter>().ToArray());
        }
        return command;
    }

    public IDataReader ExecuteDataReader(string commandText, IEnumerable<IDataParameter>? commandParameters = null)
    {
        // No `using` here — closing the reader closes the connection via CommandBehavior.CloseConnection.
        var connection = CreateAndOpenConnection();
        var command = CreateCommand(connection, commandText, commandParameters);
        return command.ExecuteReader(CommandBehavior.CloseConnection);
    }

    public object? ExecuteScalar(string commandText, IEnumerable<IDataParameter>? commandParameters = null)
    {
        using var connection = CreateAndOpenConnection();
        using var command = CreateCommand(connection, commandText, commandParameters);
        return command.ExecuteScalar();
    }

    public int ExecuteNonQuery(string commandText, IEnumerable<IDataParameter>? commandParameters = null)
    {
        using var connection = CreateAndOpenConnection();
        using var command = CreateCommand(connection, commandText, commandParameters);
        return command.ExecuteNonQuery();
    }

    protected static NpgsqlParameter Param(string name, object? value) =>
        new(name, value ?? System.DBNull.Value);
}
