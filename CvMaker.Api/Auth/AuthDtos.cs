namespace CvMaker.Api.Auth;

public record RegisterRequest(string Email, string Password, string? Name);
public record LoginRequest(string Email, string Password);

/// <summary>Projection of <see cref="Models.User"/> — deliberately omits PasswordHash.</summary>
public record AuthUser(Guid Id, string Email, string? Name);

public record AuthResponse(string AccessToken, string TokenType, int ExpiresIn, AuthUser User);
