namespace DigitalButler.Api.Models;

public enum WorkspaceRole
{
    Admin,
    Member,
    Viewer
}

public class WorkspaceMember
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;

    public WorkspaceRole Role { get; set; }
}