namespace DigitalButler.Api.DTOs;

using DigitalButler.Api.Models;

public class WorkspaceResponse
{
    public Guid Id { get; set; }
    public string Name {get; set;} = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public WorkspaceRole Role { get; set; }

}