namespace Sangu.Tms.ChatService.Services;

public sealed record ChatResponse(
    string Answer,
    bool Success,
    string Intent,
    Dictionary<string, object?>? Data = null);

