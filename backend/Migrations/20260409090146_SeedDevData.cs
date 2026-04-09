using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigitalButler.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedDevData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "PasswordHash" },
                values: new object[] { new Guid("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"), new DateTime(2026, 4, 9, 11, 0, 0, 0, DateTimeKind.Utc), "dev@test.com", "seeded-no-login" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"));
        }
    }
}
