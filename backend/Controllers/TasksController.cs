using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DigitalButler.Api.Data;

using DigitalButler.Api.DTOs;
using Microsoft.EntityFrameworkCore;
using DigitalButler.Api.Models;

namespace DigitalButler.Api.Controllers;

[ApiController]
[Authorize]
public class TaskController : ControllerBase
{

    [HttpGet("api/projects/{projectId}/tasks")]
    public async Task<IActionResult> GetAll(Guid projectId)
    {
        return Ok();
    }

    [HttpPost("api/projects/{projectId}/tasks")]
    public async Task<IActionResult> Create(Guid projectId, CreateTaskRequest request)
    {
        return Ok();
    }

    // [HttpPut("api/tasks/{taskId}")]
    // public async Task<IActionResult> Update(Guid taskId, UpdateTaskRequest request)
    // {

    // }

    // [HttpPut("api/tasks/{taskId}/move")]
    // public async Task<IActionResult> Move(Guid taskId, MoveTaskRequest request)
    // {

    // }

    // [HttpDelete("api/tasks/{taskId}")]
    // public async Task<IActionResult> Delete(Guid taskId)
    // {

    // }
}