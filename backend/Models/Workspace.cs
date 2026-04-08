namespace DigitalButler.Api.Models;

public class Workspace
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation collections
    public ICollection<WorkspaceMember> Members { get; set; } = [];
    public ICollection<Project> Projects { get; set; } = [];
}