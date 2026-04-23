using DigitalButler.Api.Config;
using DigitalButler.Api.Data;
using DigitalButler.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Text;
using TaskStatus = DigitalButler.Api.Models.TaskStatus;

namespace DigitalButler.Api.Services;

public class DailySeederService : IDailySeederService
{
    private readonly AppDbContext _db;
    private readonly DailySeedOptions _options;
    private readonly ILogger<DailySeederService> _logger;

    public DailySeederService(
        AppDbContext db,
        IOptions<DailySeedOptions> options,
        ILogger<DailySeederService> logger)
    {
        _db = db;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<string> RunAsync(CancellationToken cancellationToken = default)
    {
        var summary = new StringBuilder();
        summary.AppendLine($"Running {_options.Jobs.Count} job(s).");

        foreach (var job in _options.Jobs)
        {
            summary.AppendLine();
            summary.AppendLine($"Job: {job.WorkspaceName}");

            var owner = await _db.Users
                .FirstOrDefaultAsync(u => u.Email == job.OwnerEmail, cancellationToken);

            if (owner == null)
            {
                _logger.LogWarning("Owner not found: {Email}. Skipping job.", job.OwnerEmail);
                summary.AppendLine($"  SKIPPED: owner '{job.OwnerEmail}' not registered.");
                continue;
            }
            summary.AppendLine($"  Owner resolved: {owner.Email}");

            var aliasEmails = job.Users.Values.Distinct().ToList();
            var aliasUsers = await _db.Users
                .Where(u => aliasEmails.Contains(u.Email))
                .ToDictionaryAsync(u => u.Email, cancellationToken);

            var missing = aliasEmails.Where(e => !aliasUsers.ContainsKey(e)).ToList();
            if (missing.Count > 0)
            {
                _logger.LogWarning("Alias user(s) not registered: {Emails}. Skipping job.", string.Join(", ", missing));
                summary.AppendLine($"  SKIPPED: alias user(s) not registered: {string.Join(", ", missing)}");
                continue;
            }
            summary.AppendLine($"  Alias users resolved: {aliasEmails.Count}");

            var workspace = await _db.Workspaces
                .FirstOrDefaultAsync(w =>
                    w.Name == job.WorkspaceName &&
                    w.Members.Any(m => m.UserId == owner.Id && m.Role == WorkspaceRole.Admin),
                    cancellationToken);

            if (workspace == null)
            {
                workspace = new Workspace
                {
                    Id = Guid.NewGuid(),
                    Name = job.WorkspaceName,
                    CreatedAt = DateTime.UtcNow
                };
                var adminMembership = new WorkspaceMember
                {
                    Id = Guid.NewGuid(),
                    UserId = owner.Id,
                    WorkspaceId = workspace.Id,
                    Role = WorkspaceRole.Admin
                };
                _db.Workspaces.Add(workspace);
                _db.WorkspaceMembers.Add(adminMembership);
                await _db.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Created workspace {Name} ({Id}) for {Email}", workspace.Name, workspace.Id, owner.Email);
                summary.AppendLine($"  Workspace CREATED: {workspace.Name}");
            }
            else
            {
                summary.AppendLine($"  Workspace found: {workspace.Name}");
            }

            TimeZoneInfo tz;
            try
            {
                tz = TimeZoneInfo.FindSystemTimeZoneById(job.TimeZone);
            }
            catch (TimeZoneNotFoundException)
            {
                _logger.LogWarning("Unknown timezone: {TimeZone}. Skipping job.", job.TimeZone);
                summary.AppendLine($"  SKIPPED: unknown timezone '{job.TimeZone}'");
                continue;
            }

            var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
            var projectName = localNow.ToString(job.ProjectNameFormat, CultureInfo.InvariantCulture);

            var projectExists = await _db.Projects
                .AnyAsync(p => p.WorkspaceId == workspace.Id && p.Name == projectName, cancellationToken);

            if (projectExists)
            {
                _logger.LogInformation("Project {Name} already exists in {Workspace}. Skipping.", projectName, workspace.Name);
                summary.AppendLine($"  Project '{projectName}' already exists. Nothing to do.");
                continue;
            }

            var project = new Project
            {
                Id = Guid.NewGuid(),
                Name = projectName,
                WorkspaceId = workspace.Id,
                CreatedAt = DateTime.UtcNow
            };
            _db.Projects.Add(project);

            int taskCount = 0;
            int position = 0;
            foreach (var taskTemplate in job.Tasks)
            {
                if (!job.Users.TryGetValue(taskTemplate.AssigneeAlias, out var assigneeEmail))
                {
                    _logger.LogWarning("Task '{Title}' references unknown alias '{Alias}'. Skipping task.", taskTemplate.Title, taskTemplate.AssigneeAlias);
                    summary.AppendLine($"    WARNING: task '{taskTemplate.Title}' references unknown alias '{taskTemplate.AssigneeAlias}' — skipped.");
                    continue;
                }

                var assignee = aliasUsers[assigneeEmail];

                _db.Tasks.Add(new TaskItem
                {
                    Id = Guid.NewGuid(),
                    Title = taskTemplate.Title,
                    ProjectId = project.Id,
                    AssigneeId = assignee.Id,
                    Status = TaskStatus.Todo,
                    Position = position++,
                    CreatedAt = DateTime.UtcNow
                });
                taskCount++;
            }

            await _db.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created project {Name} with {Count} task(s) in {Workspace}", projectName, taskCount, workspace.Name);
            summary.AppendLine($"  Project CREATED: {projectName} with {taskCount} task(s).");
        }

        return summary.ToString();
    }
}
