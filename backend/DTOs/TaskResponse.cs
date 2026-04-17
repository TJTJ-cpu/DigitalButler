namespace DigitalButler.Api.DTOs;

using DigitalButler.Api.Models;

public class TaskResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskStatus Status { get; set; } = TaskStatus.Todo;
    public int Position { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? AssigneeId { get; set; }
    public string? AssigneeEmail { get; set; }

}