using DigitalButler.Api.Data;
using DigitalButler.Api.DTOs;
using DigitalButler.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;

namespace DigitalButler.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext mContext;
    private readonly IConfiguration mConfig;

    public AuthController(AppDbContext context, IConfiguration iconfig)
    {
        mContext = context;
        mConfig = iconfig;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (await mContext.Users.AnyAsync(u => u.Email == request.Email))
            return Conflict("Email already registered");
        
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        mContext.Users.Add(user);
        await mContext.SaveChangesAsync();

        return Ok(new {token = GenerateToken(user)});
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await mContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
            return Unauthorized("Invalid Credentials");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized("Invalid Credentials");

        return Ok(new { token = GenerateToken(user)});
    }


    private string GenerateToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim("UserId", user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email.ToString()),
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(mConfig["Jwt:Secret"]!)
        );

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: mConfig["Jwt:Issuer"],
            audience: mConfig["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }






}