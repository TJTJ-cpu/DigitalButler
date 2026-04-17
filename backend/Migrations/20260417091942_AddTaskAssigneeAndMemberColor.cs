using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigitalButler.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskAssigneeAndMemberColor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ThemeColor",
                table: "WorkspaceMembers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AssigneeId",
                table: "Tasks",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_AssigneeId",
                table: "Tasks",
                column: "AssigneeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Users_AssigneeId",
                table: "Tasks",
                column: "AssigneeId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Users_AssigneeId",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_AssigneeId",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "ThemeColor",
                table: "WorkspaceMembers");

            migrationBuilder.DropColumn(
                name: "AssigneeId",
                table: "Tasks");
        }
    }
}
