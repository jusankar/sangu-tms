using System.Text;

namespace Sangu.Tms.ChatService.Services;

public sealed class ChatQueryAgent
{
    private readonly OpenAiSqlGenerator _sqlGenerator;
    private readonly ReadOnlySqlRunner _sqlRunner;

    public ChatQueryAgent(OpenAiSqlGenerator sqlGenerator, ReadOnlySqlRunner sqlRunner)
    {
        _sqlGenerator = sqlGenerator;
        _sqlRunner = sqlRunner;
    }

    public async Task<ChatResponse> AnswerAsync(string rawMessage, CancellationToken cancellationToken)
    {
        var userMessage = rawMessage.Trim();
        if (string.IsNullOrWhiteSpace(userMessage))
        {
            return new ChatResponse("Please type a question.", false, "invalid_input");
        }

        try
        {
            var generatedSql = await _sqlGenerator.GenerateSqlAsync(userMessage, cancellationToken);
            var safeSql = SqlSafetyGuard.ValidateAndNormalize(generatedSql);
            var rows = await _sqlRunner.RunAsync(safeSql, maxRows: 50, cancellationToken);

            return new ChatResponse(
                BuildAnswerText(safeSql, rows),
                true,
                "ai_generated_sql",
                new Dictionary<string, object?>
                {
                    ["query"] = userMessage,
                    ["sql"] = safeSql,
                    ["rowCount"] = rows.Count,
                    ["rows"] = rows
                });
        }
        catch (Exception ex)
        {
            return new ChatResponse(
                $"Unable to complete query: {ex.Message}",
                false,
                "query_failed");
        }
    }

    private static string BuildAnswerText(string sql, IReadOnlyList<Dictionary<string, object?>> rows)
    {
        if (rows.Count == 0)
        {
            return $"No matching records found.\n\nSQL used:\n{sql}";
        }

        var sb = new StringBuilder();
        sb.AppendLine($"Found {rows.Count} row(s).");
        sb.AppendLine();
        sb.AppendLine("SQL used:");
        sb.AppendLine(sql);
        sb.AppendLine();
        sb.AppendLine("Top results:");

        foreach (var row in rows.Take(5))
        {
            var parts = row.Select(kv => $"{kv.Key}: {kv.Value}");
            sb.AppendLine($"- {string.Join(", ", parts)}");
        }

        if (rows.Count > 5)
        {
            sb.AppendLine($"- ... {rows.Count - 5} more row(s)");
        }

        return sb.ToString().Trim();
    }
}

