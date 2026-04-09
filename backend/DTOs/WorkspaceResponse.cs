namespace DigitalButler.Api.DTOs;

public class WorkspaceResponse
{
    public Guid Id { get; set; }
    public string Name {get; set;} = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

}