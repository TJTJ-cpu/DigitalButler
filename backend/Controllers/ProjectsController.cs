using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DigitalButler.Api.Data;

using DigitalButler.Api.DTOs;
using Microsoft.EntityFrameworkCore;
using DigitalButler.Api.Models;

namespace DigitalButler.Api.Controllers;


[ApiController]
[Route("api/workspaces/{workspaceId}/projects")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext mContext; 
    public ProjectsController(AppDbContext context)
    {
        mContext = context;
    }

    [HttpPost()]
    public async Task<IActionResult> Create(CreateProjectRequest request, Guid workspaceId )
    {
        var userId = Guid.Parse(User.FindFirst("UserId")!.Value);

        var currentMember = await mContext.WorkspaceMembers.FirstOrDefaultAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId);

        if (currentMember is null)
            return NotFound();

        if (currentMember.Role is WorkspaceRole.Viewer)
            return Forbid();

        var newProject = new Project
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            CreatedAt = DateTime.UtcNow,
            WorkspaceId = workspaceId,
        };

        mContext.Projects.Add(newProject);
        await mContext.SaveChangesAsync();

        return Ok(new ProjectResponse
        {
            Id = newProject.Id,
            Name = newProject.Name
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid workspaceId)
    {
        var userId = Guid.Parse(User.FindFirst("UserId")!.Value);

        var currentMember = await mContext.WorkspaceMembers.FirstOrDefaultAsync(wm => wm.UserId == userId && wm.WorkspaceId == workspaceId);

        if (currentMember is null)
            return NotFound();

        var projects = await mContext.Projects
        .Where(wm => wm.WorkspaceId == workspaceId)
        .Select(wm => new ProjectResponse
        {
            Id = wm.Id,
            Name = wm.Name
        }).ToListAsync();
        
        return Ok(projects);
    }

    [HttpDelete("{projectId}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid workspaceId)
    {
        var userId = Guid.Parse(User.FindFirst("UserId")!.Value);

        var currentMember = await mContext.WorkspaceMembers.FirstOrDefaultAsync(
            wm => wm.UserId == userId && wm.WorkspaceId == workspaceId);

        if (currentMember is null)
            return NotFound();
        
        if (currentMember.Role != WorkspaceRole.Admin)
            return Forbid();
        
        var projectToDelete = await mContext.Projects.FirstOrDefaultAsync(p => p.Id == projectId && p.WorkspaceId == workspaceId );

        if (projectToDelete is null)
            return NotFound();

        mContext.Projects.Remove(projectToDelete);
        await mContext.SaveChangesAsync();
        
        return Ok(new ProjectResponse
        {
            Id = projectToDelete.Id,
            Name = projectToDelete.Name
        });
    }
}

