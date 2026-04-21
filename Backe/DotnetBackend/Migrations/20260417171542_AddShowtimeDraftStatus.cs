using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebPhimApi.Migrations
{
    /// <inheritdoc />
    public partial class AddShowtimeDraftStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "showtimes",
                type: "enum('draft','active','cancelled','completed')",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "enum('active','cancelled','completed')")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "showtimes",
                type: "enum('active','cancelled','completed')",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "enum('draft','active','cancelled','completed')")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
