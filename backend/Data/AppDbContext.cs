using Microsoft.EntityFrameworkCore;
using DigitalButler.Api.Models;

namespace DigitalButler.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Workspace> Workspaces { get; set; }
    public DbSet<WorkspaceMember> WorkspaceMembers { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<TaskItem> Tasks { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WorkspaceMember>()
            .HasIndex(wm => new{wm.UserId, wm.WorkspaceId})
            .IsUnique();
        
        modelBuilder.Entity<WorkspaceMember>()
            .Property(wm => wm.Role)
            .HasConversion<string>();
        
        modelBuilder.Entity<TaskItem>()
            .Property(t => t.Status)
            .HasConversion<string>();

        modelBuilder.Entity<TaskItem>()
            .HasIndex(t => new {t.ProjectId, t.Status, t.Position});

            var testUserId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

            modelBuilder.Entity<User>().HasData(new User
            {
                Id = testUserId,
                Email = "dev@test.com",
                PasswordHash = "seeded-no-login",
                CreatedAt = new DateTime(2026, 4, 9, 11, 0, 0, DateTimeKind.Utc)
            });


        base.OnModelCreating(modelBuilder);
    }




}