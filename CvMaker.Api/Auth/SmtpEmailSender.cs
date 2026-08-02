using System.Net;
using System.Net.Mail;

namespace CvMaker.Api.Auth;

public class SmtpOptions
{
    public const string SectionName = "Email:Smtp";

    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string From { get; set; } = "no-reply@cvmaker.local";
    public bool UseSsl { get; set; } = true;
}

public class SmtpEmailSender(Microsoft.Extensions.Options.IOptions<SmtpOptions> options) : IEmailSender
{
    private readonly SmtpOptions _opts = options.Value;

    public async Task SendPasswordResetAsync(string toEmail, string resetUrl, CancellationToken ct = default)
    {
        using var client = new SmtpClient(_opts.Host, _opts.Port) { EnableSsl = _opts.UseSsl };
        if (!string.IsNullOrEmpty(_opts.Username))
            client.Credentials = new NetworkCredential(_opts.Username, _opts.Password);

        using var message = new MailMessage(_opts.From, toEmail)
        {
            Subject = "Reset your CvMaker password",
            Body = $"""
                   Someone asked to reset the password for this CvMaker account.

                   {resetUrl}

                   This link can be used once and expires in one hour.
                   If it wasn't you, no action is needed — your password is unchanged.
                   """,
        };

        await client.SendMailAsync(message, ct);
    }
}
