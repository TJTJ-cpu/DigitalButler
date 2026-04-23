namespace DigitalButler.Api.Services;

public interface IDailySeederService
{
    Task<string> RunAsync(CancellationToken cancellationToken = default);
}
