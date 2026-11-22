using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EducationalPlatform.Morabbi.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTarbiyatiFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Morabbi_daily_trackers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InstructorId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<string>(type: "nvarchar(20)", nullable: false),
                    SalatFajr = table.Column<bool>(type: "bit", nullable: false),
                    SalatZuhr = table.Column<bool>(type: "bit", nullable: false),
                    SalatAsr = table.Column<bool>(type: "bit", nullable: false),
                    SalatMaghrib = table.Column<bool>(type: "bit", nullable: false),
                    SalatIsha = table.Column<bool>(type: "bit", nullable: false),
                    DhikrMorning = table.Column<bool>(type: "bit", nullable: false),
                    DhikrEvening = table.Column<bool>(type: "bit", nullable: false),
                    Quran = table.Column<bool>(type: "bit", nullable: false),
                    Fasting = table.Column<bool>(type: "bit", nullable: false),
                    Study = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_daily_trackers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Morabbi_daily_trackers_Morabbi_users_InstructorId",
                        column: x => x.InstructorId,
                        principalTable: "Morabbi_users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_hadiths",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Source = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    Narrator = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Topic = table.Column<string>(type: "nvarchar(200)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_hadiths", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_methodologies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(300)", nullable: false),
                    Desc = table.Column<string>(type: "nvarchar(1000)", nullable: true),
                    Steps = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_methodologies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_people",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(20)", nullable: true),
                    Age = table.Column<int>(type: "int", nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(30)", nullable: true),
                    Grade = table.Column<string>(type: "nvarchar(100)", nullable: true),
                    Group = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    JoinDate = table.Column<string>(type: "nvarchar(20)", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_people", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_quran_verses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Surah = table.Column<string>(type: "nvarchar(100)", nullable: false),
                    VerseNo = table.Column<int>(type: "int", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Topic = table.Column<string>(type: "nvarchar(200)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_quran_verses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_sessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InstructorId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    Date = table.Column<string>(type: "nvarchar(20)", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(300)", nullable: false),
                    Attendees = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    Place = table.Column<string>(type: "nvarchar(300)", nullable: true),
                    Agenda = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Decisions = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Followup = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Morabbi_sessions_Morabbi_users_InstructorId",
                        column: x => x.InstructorId,
                        principalTable: "Morabbi_users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_tasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InstructorId = table.Column<int>(type: "int", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(500)", nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    Due = table.Column<string>(type: "nvarchar(20)", nullable: true),
                    Done = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_tasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Morabbi_tasks_Morabbi_users_InstructorId",
                        column: x => x.InstructorId,
                        principalTable: "Morabbi_users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_attendance",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PersonId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<string>(type: "nvarchar(20)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_attendance", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Morabbi_attendance_Morabbi_people_PersonId",
                        column: x => x.PersonId,
                        principalTable: "Morabbi_people",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_attendance_PersonId_Date",
                table: "Morabbi_attendance",
                columns: new[] { "PersonId", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_daily_trackers_InstructorId_Date",
                table: "Morabbi_daily_trackers",
                columns: new[] { "InstructorId", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_hadiths_Source",
                table: "Morabbi_hadiths",
                column: "Source");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_methodologies_Name",
                table: "Morabbi_methodologies",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_people_Name",
                table: "Morabbi_people",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_quran_verses_Surah",
                table: "Morabbi_quran_verses",
                column: "Surah");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_sessions_InstructorId",
                table: "Morabbi_sessions",
                column: "InstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_tasks_InstructorId",
                table: "Morabbi_tasks",
                column: "InstructorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Morabbi_attendance");

            migrationBuilder.DropTable(
                name: "Morabbi_daily_trackers");

            migrationBuilder.DropTable(
                name: "Morabbi_hadiths");

            migrationBuilder.DropTable(
                name: "Morabbi_methodologies");

            migrationBuilder.DropTable(
                name: "Morabbi_quran_verses");

            migrationBuilder.DropTable(
                name: "Morabbi_sessions");

            migrationBuilder.DropTable(
                name: "Morabbi_tasks");

            migrationBuilder.DropTable(
                name: "Morabbi_people");
        }
    }
}
