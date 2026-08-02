namespace CvMaker.Api.Auth;

public interface IEmailSender
{
    Task SendPasswordResetAsync(string toEmail, string resetUrl, CancellationToken ct = default);
}

/// <summary>
/// Development stand-in: writes the reset link to the application log instead of sending
/// mail. Program.cs refuses to start outside Development while this is the registered
/// implementation — a silently-dropped reset email locks users out with no visible failure,
/// which is worse than refusing to boot.
/// </summary>
public class LoggingEmailSender(ILogger<LoggingEmailSender> logger) : IEmailSender
{
    public Task SendPasswordResetAsync(string toEmail, string resetUrl, CancellationToken ct = default)
    {
        logger.LogInformation("[dev] Password reset for {Email}: {ResetUrl}", toEmail, resetUrl);
        return Task.CompletedTask;
    }
}
