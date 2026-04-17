using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigitalButler.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveThemeColor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ThemeColor",
                table: "WorkspaceMembers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ThemeColor",
                table: "WorkspaceMembers",
                type: "text",
                nullable: true);
        }
    }
}
