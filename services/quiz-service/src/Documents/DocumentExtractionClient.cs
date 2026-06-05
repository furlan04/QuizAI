using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace QuizService.Documents;

/// <summary>Risultato dell'estrazione testo dal documento (ai-agent-service).</summary>
public record ExtractedDocument(
    [property: JsonPropertyName("text")] string Text,
    [property: JsonPropertyName("suggested_topic")] string SuggestedTopic,
    [property: JsonPropertyName("char_count")] int CharCount
);

public interface IDocumentExtractionClient
{
    /// <summary>
    /// Invia i byte del file all'ai-agent-service che ne estrae il testo in memoria
    /// (nessun salvataggio su disco) e lo restituisce.
    /// </summary>
    Task<ExtractedDocument> ExtractAsync(
        Stream content, string fileName, string contentType, CancellationToken ct = default);
}

public class DocumentExtractionClient : IDocumentExtractionClient
{
    private readonly HttpClient _http;

    public DocumentExtractionClient(HttpClient http) => _http = http;

    public async Task<ExtractedDocument> ExtractAsync(
        Stream content, string fileName, string contentType, CancellationToken ct = default)
    {
        using var form = new MultipartFormDataContent();
        var fileContent = new StreamContent(content);
        if (!string.IsNullOrWhiteSpace(contentType))
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        form.Add(fileContent, "file", fileName);

        HttpResponseMessage resp;
        try
        {
            resp = await _http.PostAsync("/documents/extract", form, ct);
        }
        catch (Exception ex)
        {
            throw new DocumentExtractionException(502, $"Servizio di estrazione non raggiungibile: {ex.Message}");
        }

        using (resp)
        {
            var body = await resp.Content.ReadAsStringAsync(ct);
            if (!resp.IsSuccessStatusCode)
                throw new DocumentExtractionException((int)resp.StatusCode, ExtractDetail(body));

            ExtractedDocument? result;
            try
            {
                result = JsonSerializer.Deserialize<ExtractedDocument>(body);
            }
            catch (JsonException)
            {
                throw new DocumentExtractionException(502, "Risposta di estrazione non valida");
            }

            if (result is null || string.IsNullOrWhiteSpace(result.Text))
                throw new DocumentExtractionException(422, "Nessun testo estraibile dal documento");

            return result;
        }
    }

    private static string ExtractDetail(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("detail", out var d))
                return d.ToString();
        }
        catch (JsonException) { /* corpo non JSON */ }
        return "Estrazione del documento fallita";
    }
}

/// <summary>Errore tipizzato dell'estrazione, con lo status da rimappare al client.</summary>
public class DocumentExtractionException : Exception
{
    public int StatusCode { get; }
    public DocumentExtractionException(int statusCode, string message) : base(message)
        => StatusCode = statusCode;
}
