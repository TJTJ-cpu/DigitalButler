using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigitalButler.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLastMovedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastMovedAt",
                table: "Tasks",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastMovedAt",
                table: "Tasks");
        }
    }
}
