namespace AuthService.Email;

/// <summary>
/// Fallback per sviluppo: logga l'email su console invece di inviarla.
/// Usato quando SMTP_HOST non è configurato.
/// </summary>
public class LoggerEmailSender : IEmailSender
{
    private readonly ILogger<LoggerEmailSender> _logger;
    public LoggerEmailSender(ILogger<LoggerEmailSender> logger) => _logger = logger;

    public Task SendAsync(string to, string subject, string htmlBody)
    {
        _logger.LogWarning(
            "[DEV EMAIL — SMTP non configurato]\n→ A: {To}\n→ Oggetto: {Subject}\n→ Body:\n{Body}",
            to, subject, htmlBody);
        return Task.CompletedTask;
    }
}
