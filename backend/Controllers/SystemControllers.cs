using DigitalButler.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DigitalButler.Api.Controllers;

[ApiController]
[Route("api/system")]
[AllowAnonymous]
public class SystemController : ControllerBase
{
    private readonly IDailySeederService _seeder;
    private readonly IConfiguration _config;
    private readonly ILogger<SystemController> _logger;

    public SystemController(
        IDailySeederService seeder,
        IConfiguration config,
        ILogger<SystemController> logger)
    {
        _seeder = seeder;
        _config = config;
        _logger = logger;
    }

    [HttpPost("daily-seed")]
    public async Task<IActionResult> RunDailySeed(CancellationToken cancellationToken)
    {
        var expected = _config["SeedSecret"];
        if (string.IsNullOrEmpty(expected))
        {
            _logger.LogError("SeedSecret is not configured. Refusing to run.");
            return StatusCode(500, "Seed secret not configured on server.");
        }

        var provided = Request.Headers["X-Seed-Secret"].ToString();
        if (provided != expected)
        {
            _logger.LogWarning("Daily seed called with wrong or missing X-Seed-Secret header.");
            return Unauthorized();
        }

        var summary = await _seeder.RunAsync(cancellationToken);
        _logger.LogInformation("Daily seed completed.\n{Summary}", summary);
        return Ok(summary);
    }
}

