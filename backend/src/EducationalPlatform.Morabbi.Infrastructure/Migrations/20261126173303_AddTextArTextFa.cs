using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EducationalPlatform.Morabbi.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTextArTextFa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Text",
                table: "Morabbi_quran_verses",
                newName: "TextAr");

            migrationBuilder.RenameColumn(
                name: "Text",
                table: "Morabbi_hadiths",
                newName: "TextAr");

            migrationBuilder.AddColumn<string>(
                name: "TextFa",
                table: "Morabbi_quran_verses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TextFa",
                table: "Morabbi_hadiths",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TextFa",
                table: "Morabbi_quran_verses");

            migrationBuilder.DropColumn(
                name: "TextFa",
                table: "Morabbi_hadiths");

            migrationBuilder.RenameColumn(
                name: "TextAr",
                table: "Morabbi_quran_verses",
                newName: "Text");

            migrationBuilder.RenameColumn(
                name: "TextAr",
                table: "Morabbi_hadiths",
                newName: "Text");
        }
    }
}
