using System.Text;
using System.Text.Json;

namespace Sangu.Tms.ChatService.Services;

public sealed class OpenAiSqlGenerator
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public OpenAiSqlGenerator(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<string> GenerateSqlAsync(string userMessage, CancellationToken cancellationToken)
    {
        var apiKey = _configuration["OpenAI:ApiKey"] ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("OpenAI API key is missing. Set OpenAI:ApiKey or OPENAI_API_KEY.");
        }

        var baseUrl = _configuration["OpenAI:BaseUrl"] ?? "https://api.openai.com";
        var model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";

        var endpoint = $"{baseUrl.TrimEnd('/')}/v1/chat/completions";
        var schemaPrompt = """
You are a PostgreSQL SQL generator for Sangu TMS.
Generate exactly one read-only SQL statement for the user's question.

Allowed tables and key fields:
- customers(id, code, name, is_deleted)
- consignments(id, consignment_no, customer_id, booking_date, freight_amount, status)
- challans(id, challan_no, challan_date, total_hire, paid_amount, status)
- invoices(id, invoice_no, invoice_date, consignment_id, total_amount, received_amount, due_date, status)
- money_receipts(id, receipt_no, receipt_date, invoice_id, amount, mode, reference_no, status)

Rules:
- SQL must be one SELECT (or WITH...SELECT) only.
- Never generate INSERT/UPDATE/DELETE/ALTER/DROP/CREATE/TRUNCATE.
- Prefer ILIKE for text matching.
- Include relevant fields for answer context.
- Keep result set reasonably small (use LIMIT 50 when needed).
- Return JSON only: {"sql":"..."}.
""";

        var payload = new
        {
            model,
            temperature = 0,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new { role = "system", content = schemaPrompt },
                new { role = "user", content = userMessage }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"OpenAI request failed: {(int)response.StatusCode} {responseBody}");
        }

        using var doc = JsonDocument.Parse(responseBody);
        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new InvalidOperationException("OpenAI returned empty content.");
        }

        using var generated = JsonDocument.Parse(content);
        if (!generated.RootElement.TryGetProperty("sql", out var sqlProp))
        {
            throw new InvalidOperationException("OpenAI response JSON does not contain 'sql'.");
        }

        var sql = sqlProp.GetString();
        if (string.IsNullOrWhiteSpace(sql))
        {
            throw new InvalidOperationException("Generated SQL was empty.");
        }

        return sql;
    }
}

