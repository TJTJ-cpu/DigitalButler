using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DigitalButler.Api.Data;

using DigitalButler.Api.DTOs;
using Microsoft.EntityFrameworkCore;
using DigitalButler.Api.Models;

using TaskStatus = DigitalButler.Api.Models.TaskStatus;

namespace DigitalButler.Api.Controllers;

[ApiController]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly AppDbContext mContext;

    public TasksController(AppDbContext context)
    {
        mContext  = context;
    }

    [HttpGet("api/projects/{projectId}/tasks")]
    public async Task<IActionResult> GetAll(Guid projectId)
    {
        var userId = Guid.Parse(User.FindFirst("UserId")!.Value);

        var project = await mContext.Projects.FirstOrDefaultAsync(p => p.Id == projectId);

        if (project is null)
            return NotFound();

        var currentMember = await mContext.WorkspaceMembers.FirstOrDefaultAsync(wm => wm.WorkspaceId == project.WorkspaceId && wm.UserId == userId);

        if (currentMember is null)
            return NotFound();

        var tasks = await mContext.Tasks
            .Where(t => t.ProjectId == projectId)
            .OrderBy(t => t.Status)
            .ThenBy(t => t.Position)
            .Select(t => new TaskResponse
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                Status = t.Status,
                Position = t.Position,
                CreatedAt = t.CreatedAt
            }).ToListAsync();

        return Ok(tasks);
    }

    [HttpPost("api/projects/{projectId}/tasks")]
    public async Task<IActionResult> Create(Guid projectId, CreateTaskRequest request)
    {
        var userId = Guid.Parse(User.FindFirst("UserId")!.Value);

        var project = await mContext.Projects.FirstOrDefaultAsync(p => p.Id == projectId);

        if (project is null)
            return NotFound();

        var currentMember = await mContext.WorkspaceMembers.FirstOrDefaultAsync(wm => wm.WorkspaceId == project.WorkspaceId && wm.UserId == userId);

        if (currentMember is null)
            return NotFound();

        if (currentMember.Role is WorkspaceRole.Viewer)
            return Forbid();

        var maxPosition = await mContext.Tasks
            .Where(t => t.ProjectId == projectId && t.Status == TaskStatus.Todo)
            .Select(t => (int?)t.Position)
            .MaxAsync() ?? -1;

        var newPosition = maxPosition + 1;

        var newTask = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Status = TaskStatus.Todo,
            Position = newPosition,
            CreatedAt = DateTime.UtcNow,
            ProjectId = projectId,

        };

        mContext.Tasks.Add(newTask);
        await mContext.SaveChangesAsync();

        return Ok(new TaskResponse
        {
            Id = newTask.Id,
            Title = newTask.Title,
            Description = newTask.Description,
            Status = newTask.Status,
            Position = newTask.Position,
            CreatedAt = newTask.CreatedAt,
        });
    }

    [HttpPut("api/tasks/{taskId}")]
    public async Task<IActionResult> Update(Guid taskId, UpdateTaskRequest request)
    {
        var userId = Guid.Parse(User.FindFirst("UserId")!.Value);

        var task = await mContext.Tasks.Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == taskId);

        if (task is null)
            return NotFound();
        
        var currentMember = await mContext.WorkspaceMembers.FirstOrDefaultAsync(wm => wm.WorkspaceId == task.Project.WorkspaceId && wm.UserId == userId);

        if (currentMember is null)
            return NotFound();
        
        if (currentMember.Role == WorkspaceRole.Viewer)
            return Forbid();
        
        task.Title = request.Title;
        task.Description = request.Description;
    
        await mContext.SaveChangesAsync();

        return Ok(new TaskResponse
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            Status = task.Status,
            Position = task.Position,
            CreatedAt = task.CreatedAt
        });
    }

    [HttpPut("api/tasks/{taskId}/move")]
    public async Task<IActionResult> Move(Guid taskId, MoveTaskRequest request)
    {
        var userId = Guid.Parse(User.FindFirst("UserId")!.Value);

        var task = await mContext.Tasks.Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == taskId);

        if (task is null)
            return NotFound();
        
        var currentMember = await mContext.WorkspaceMembers.FirstOrDefaultAsync(wm => wm.WorkspaceId == task.Project.WorkspaceId && wm.UserId == userId);

        if (currentMember is null)
            return NotFound();

        if (currentMember.Role == WorkspaceRole.Viewer)
            return Forbid();

        var oldStatus = task.Status;
        var oldPosition = task.Position;
        var newStatus = request.NewStatus;
        var newPosition = request.NewPosition;

        using var transaction = await mContext.Database.BeginTransactionAsync();

        if (oldStatus == newStatus)
        {
            if (newPosition > oldPosition)
            {
                await mContext.Tasks
                    .Where(t => t.ProjectId == task.ProjectId
                            && t.Status == oldStatus
                            && t.Id != task.Id
                            && t.Position > oldPosition
                            && t.Position <= newPosition)
                    .ExecuteUpdateAsync(s => s.SetProperty(t => t.Position, t => t.Position - 1));
            }
            else if (newPosition < oldPosition)
            {
                await mContext.Tasks
                    .Where(t => t.ProjectId == task.ProjectId
                            && t.Status == oldStatus
                            && t.Id != task.Id
                            && t.Position >= newPosition
                            && t.Position < oldPosition)
                    .ExecuteUpdateAsync(s => s.SetProperty(t => t.Position, t => t.Position + 1));
            }
        }
        else
        {
            await mContext.Tasks
                .Where(t => t.ProjectId == task.ProjectId
                        && t.Status == oldStatus
                        && t.Id != task.Id
                        && t.Position > oldPosition)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.Position, t => t.Position - 1));

            await mContext.Tasks
                .Where(t => t.ProjectId == task.ProjectId
                        && t.Status == newStatus
                        && t.Id != task.Id
                        && t.Position >= newPosition)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.Position, t => t.Position + 1));
        }


        task.Status = request.NewStatus;
        task.Position = request.NewPosition;

        await mContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new TaskResponse
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            Status = task.Status,
            Position = task.Position,
            CreatedAt = task.CreatedAt
        });
    }

    [HttpDelete("api/tasks/{taskId}")]
    public async Task<IActionResult> Delete(Guid taskId)
    {
        var userId = Guid.Parse(User.FindFirst("UserId")!.Value);

        var task = await mContext.Tasks.Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == taskId);

        if (task is null)
            return NotFound();
        
        var currentMember = await mContext.WorkspaceMembers.FirstOrDefaultAsync(wm => wm.WorkspaceId == task.Project.WorkspaceId && wm.UserId == userId);

        if (currentMember is null)
            return NotFound();

        if (currentMember.Role is WorkspaceRole.Viewer)
            return Forbid();
        
        mContext.Tasks.Remove(task);
        await mContext.SaveChangesAsync();

        return Ok(new TaskResponse
        {
            Id = task.Id,
            Title = task.Title,
           Description = task.Description,
            Status = task.Status,
            Position = task.Position,
            CreatedAt = task.CreatedAt,
        });
    }





}