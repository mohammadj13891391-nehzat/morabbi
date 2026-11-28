using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EducationalPlatform.Morabbi.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentsBooksTrainingLoop : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TrainingLoop",
                table: "Morabbi_users",
                type: "nvarchar(50)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Morabbi_books",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(300)", nullable: false),
                    Author = table.Column<string>(type: "nvarchar(200)", nullable: true),
                    Category = table.Column<string>(type: "nvarchar(100)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Loops = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_books", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_comments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TargetType = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    TargetId = table.Column<int>(type: "int", nullable: false),
                    AuthorId = table.Column<int>(type: "int", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Anchor = table.Column<string>(type: "nvarchar(200)", nullable: true),
                    ParentId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_comments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Morabbi_comments_Morabbi_comments_ParentId",
                        column: x => x.ParentId,
                        principalTable: "Morabbi_comments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Morabbi_comments_Morabbi_users_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Morabbi_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_comments_AuthorId",
                table: "Morabbi_comments",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_comments_ParentId",
                table: "Morabbi_comments",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_comments_TargetType_TargetId",
                table: "Morabbi_comments",
                columns: new[] { "TargetType", "TargetId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Morabbi_books");

            migrationBuilder.DropTable(
                name: "Morabbi_comments");

            migrationBuilder.DropColumn(
                name: "TrainingLoop",
                table: "Morabbi_users");
        }
    }
}
