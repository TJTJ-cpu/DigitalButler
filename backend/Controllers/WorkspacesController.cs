using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DigitalButler.Api.Data;

using DigitalButler.Api.DTOs;
using Microsoft.EntityFrameworkCore;
using DigitalButler.Api.Models;


namespace DigitalButler.Api.Controllers;

[ApiController]
[Route("api/workspaces")]
[Authorize]
public class WorkspacesController : ControllerBase
{
    private readonly AppDbContext mContext;
    private readonly IConfiguration mConfig;

    public WorkspacesController(AppDbContext context, IConfiguration config)
    {
        mContext = context;
        mConfig = config;
    }

    [HttpPost()]
    public async Task<IActionResult> Create(CreateWorkspaceRequest request)
    {
        var userId = Guid.Parse(User.FindFirst("UserId")!.Value);

        var workspace = new Workspace
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            CreatedAt = DateTime.UtcNow,
        };
        var WorkspaceMember = new WorkspaceMember
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            WorkspaceId = workspace.Id,
            Role = WorkspaceRole.Admin
        };

        mContext.Workspaces.Add(workspace);
        mContext.WorkspaceMembers.Add(WorkspaceMember);
        await mContext.SaveChangesAsync();

        return Ok(new WorkspaceResponse
        {
            Id = workspace.Id,
            Name = workspace.Name,
            CreatedAt = DateTime.UtcNow
        });
    }

    [HttpGet()]
    public async Task<IActionResult> GetAll()
    {
        var userId = Guid.Parse(User.FindFirst("UserId")!.Value);

        var workspaces = await mContext.WorkspaceMembers.Where(wm => wm.UserId == userId)
        .Select(wm => new WorkspaceResponse
        {
            Id = wm.Workspace.Id,
            Name = wm.Workspace.Name,
            CreatedAt = wm.Workspace.CreatedAt
        }).ToListAsync();

        return Ok(workspaces);
    }


    [HttpGet("{id}/members")]
    public async Task<IActionResult> GetMembers(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst("UserId")!.Value);
        
        var currentMember = await mContext.WorkspaceMembers.FirstOrDefaultAsync(wm => wm.WorkspaceId == id && wm.UserId == userId );

        if (currentMember is null)
            return NotFound();
        
        var members = await mContext.WorkspaceMembers
        .Where(wm => wm.WorkspaceId == id)
        .Select(wm => new MemberResponse
        {
            UserId = wm.UserId,
            Email = wm.User.Email,
            Role = wm.Role
        }).ToListAsync();

        return Ok(members);
    }


    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(Guid id, AddMemberRequest request )
   {
        var userId = Guid.Parse(User.FindFirst("UserId")!.Value);

        var currentMember = await mContext.WorkspaceMembers.FirstOrDefaultAsync(wm => wm.WorkspaceId == id && wm.UserId == userId);

        if (currentMember == null)
            return NotFound();

        if (currentMember.Role != WorkspaceRole.Admin)
            return Forbid();
        var newUser = await mContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (newUser == null)
            return NotFound("User Not Found");

        var alreadyMember = await mContext.WorkspaceMembers.AnyAsync(wm => wm.WorkspaceId == id && wm.UserId == newUser.Id);

        if (alreadyMember)
            return Conflict("User is already a member");

        var newMember = new WorkspaceMember
        {
            Id = Guid.NewGuid(),
            UserId = newUser.Id,
            WorkspaceId = id,
            Role = request.Role
        };

        mContext.WorkspaceMembers.Add(newMember);
        await mContext.SaveChangesAsync();
        return Ok(new MemberResponse
        {
            UserId = newMember.UserId,
            Email = newMember.User.Email,
            Role = newMember.Role
        });
    }

    [HttpDelete("{workspaceId}/members/{memberUserId}")]
    public async Task<IActionResult> RemoveMember(Guid workspaceId, Guid memberUserId)
    { 
        var userId = Guid.Parse(User.FindFirst("UserId")!.Value);

        var currentMember = await mContext.WorkspaceMembers
        .Include(wm => wm.User)
        .FirstOrDefaultAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId);

        var memberToRemove = await mContext.WorkspaceMembers
        .Include(wm => wm.User)
        .FirstOrDefaultAsync(wm => wm.WorkspaceId == workspaceId  && wm.UserId == memberUserId);

        if (currentMember is null)
            return NotFound();

        if (currentMember.Role != WorkspaceRole.Admin)
            return Forbid();

        if(memberToRemove is null)
            return NotFound("Member to remove is not found.");

        mContext.WorkspaceMembers.Remove(memberToRemove);
        await mContext.SaveChangesAsync();

        return Ok(new MemberResponse
        {
            UserId = memberToRemove.UserId,
            Email = memberToRemove.User.Email,
            Role = memberToRemove.Role
        });
    }

    [HttpDelete("{workspaceId}")]
    public async Task<IActionResult> DeleteWorkspace(Guid workspaceId)
    {
        var userId = Guid.Parse(User.FindFirst("UserId")!.Value);

        var currentMember = await mContext.WorkspaceMembers
        .FirstOrDefaultAsync(wm => wm.WorkspaceId == workspaceId && wm.UserId == userId);

        if (currentMember is null)
            return NotFound();

        if (currentMember.Role != WorkspaceRole.Admin)
            return Forbid();
        
        var workspace = await mContext.Workspaces
        .FirstOrDefaultAsync(w => w.Id == workspaceId);

        if (workspace is null)
            return NotFound();
        
        mContext.Workspaces.Remove(workspace);
        await mContext.SaveChangesAsync();
        return Ok(new WorkspaceResponse
        {
            Id = workspace.Id,
            Name = workspace.Name,
            CreatedAt = DateTime.UtcNow
        });
    }



}