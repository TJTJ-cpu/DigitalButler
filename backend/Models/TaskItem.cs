namespace DigitalButler.Api.Models;

public enum TaskStatus
{
    Todo,
    InProgress,
    Done
}

public class TaskItem
{
    public Guid Id { get; set; }
    public Guid ? AssigneeId {get; set;}
    public User ? Assignee {get; set;}
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskStatus Status { get; set; } = TaskStatus.Todo;
    public int Position { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
}