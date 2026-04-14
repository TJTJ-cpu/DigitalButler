namespace DigitalButler.Api.Models;

public class Project
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid WorkspaceId { get; set; }

    public Workspace Workspace { get; set; } = null!;

    public ICollection<TaskItem> Tasks { get; set; } = [];
}