using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EducationalPlatform.Morabbi.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPushSubscription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Morabbi_push_subscriptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    Endpoint = table.Column<string>(type: "nvarchar(1000)", nullable: false),
                    P256dh = table.Column<string>(type: "nvarchar(256)", nullable: false),
                    Auth = table.Column<string>(type: "nvarchar(256)", nullable: false),
                    UserAgent = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_push_subscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Morabbi_push_subscriptions_Morabbi_users_UserId",
                        column: x => x.UserId,
                        principalTable: "Morabbi_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_push_subscriptions_Endpoint",
                table: "Morabbi_push_subscriptions",
                column: "Endpoint",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_push_subscriptions_UserId",
                table: "Morabbi_push_subscriptions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Morabbi_push_subscriptions");
        }
    }
}
