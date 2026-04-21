using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebPhimApi.Migrations
{
    /// <inheritdoc />
    public partial class AddMovieDraftStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "movies",
                type: "enum('draft','showing','coming')",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "enum('showing','coming')")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "movies",
                type: "enum('showing','coming')",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "enum('draft','showing','coming')")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
