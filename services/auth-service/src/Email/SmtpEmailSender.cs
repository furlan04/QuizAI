using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace AuthService.Email;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration config, ILogger<SmtpEmailSender> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        var host = _config["SMTP_HOST"]!;
        var port = int.Parse(_config["SMTP_PORT"] ?? "587");
        var user = _config["SMTP_USER"];
        var pass = _config["SMTP_PASS"];
        var from = _config["SMTP_FROM"] ?? user!;
        var fromName = _config["SMTP_FROM_NAME"] ?? "QuizAI";

        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(fromName, from));
        msg.To.Add(MailboxAddress.Parse(to));
        msg.Subject = subject;
        msg.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(host, port, SecureSocketOptions.StartTlsWhenAvailable);
        if (!string.IsNullOrWhiteSpace(user))
            await client.AuthenticateAsync(user, pass);
        await client.SendAsync(msg);
        await client.DisconnectAsync(quit: true);

        _logger.LogInformation("Email inviata a {To} (oggetto: {Subject})", to, subject);
    }
}
