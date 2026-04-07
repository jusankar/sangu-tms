using System.Text.RegularExpressions;

namespace Sangu.Tms.ChatService.Services;

public static class SqlSafetyGuard
{
    private static readonly Regex ForbiddenKeywords = new(
        @"\b(insert|update|delete|drop|truncate|alter|create|grant|revoke|copy|call|execute|merge|comment)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public static string ValidateAndNormalize(string sql)
    {
        if (string.IsNullOrWhiteSpace(sql))
        {
            throw new InvalidOperationException("Generated SQL is empty.");
        }

        var trimmed = sql.Trim();
        if (trimmed.EndsWith(';'))
        {
            trimmed = trimmed[..^1].TrimEnd();
        }

        if (trimmed.Contains(';'))
        {
            throw new InvalidOperationException("Only a single statement is allowed.");
        }

        if (trimmed.Contains("--", StringComparison.Ordinal) || trimmed.Contains("/*", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("SQL comments are not allowed.");
        }

        if (!(trimmed.StartsWith("select", StringComparison.OrdinalIgnoreCase)
              || trimmed.StartsWith("with", StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException("Only SELECT/CTE read-only queries are allowed.");
        }

        if (ForbiddenKeywords.IsMatch(trimmed))
        {
            throw new InvalidOperationException("Write operations are blocked. Read-only queries only.");
        }

        return trimmed;
    }
}

