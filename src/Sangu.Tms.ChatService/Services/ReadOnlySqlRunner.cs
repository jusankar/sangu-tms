using Microsoft.EntityFrameworkCore;
using Sangu.Tms.Infrastructure.Data;
using System.Data;

namespace Sangu.Tms.ChatService.Services;

public sealed class ReadOnlySqlRunner
{
    private readonly SanguTmsDbContext _db;

    public ReadOnlySqlRunner(SanguTmsDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Dictionary<string, object?>>> RunAsync(string sql, int maxRows, CancellationToken cancellationToken)
    {
        var safeSql = SqlSafetyGuard.ValidateAndNormalize(sql);
        var wrappedSql = $"select * from ({safeSql}) as q limit @p_limit";

        var connection = _db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        await using var command = connection.CreateCommand();
        command.CommandText = wrappedSql;

        var limitParam = command.CreateParameter();
        limitParam.ParameterName = "p_limit";
        limitParam.Value = maxRows;
        command.Parameters.Add(limitParam);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var result = new List<Dictionary<string, object?>>();

        while (await reader.ReadAsync(cancellationToken))
        {
            var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            for (var i = 0; i < reader.FieldCount; i++)
            {
                row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            }
            result.Add(row);
        }

        return result;
    }
}

