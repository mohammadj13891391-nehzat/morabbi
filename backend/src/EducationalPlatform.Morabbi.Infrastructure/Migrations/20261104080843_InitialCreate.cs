using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EducationalPlatform.Morabbi.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Morabbi_evaluation_criteria",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    Weight = table.Column<int>(type: "int", nullable: false),
                    RubricLevels = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Active = table.Column<bool>(type: "bit", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    DefinedBy = table.Column<string>(type: "nvarchar(200)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_evaluation_criteria", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_maktabs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    Active = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_maktabs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_branches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(30)", nullable: true),
                    MaktabId = table.Column<int>(type: "int", nullable: true),
                    IsBoys = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_branches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Morabbi_branches_Morabbi_maktabs_MaktabId",
                        column: x => x.MaktabId,
                        principalTable: "Morabbi_maktabs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    NationalId = table.Column<string>(type: "nvarchar(20)", nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(30)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    OidcSubject = table.Column<string>(type: "nvarchar(255)", nullable: true),
                    Role = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    RequestedRole = table.Column<string>(type: "nvarchar(50)", nullable: true),
                    BranchId = table.Column<int>(type: "int", nullable: true),
                    MaktabId = table.Column<int>(type: "int", nullable: true),
                    ApprovalStatus = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    ApprovedBy = table.Column<string>(type: "nvarchar(200)", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Active = table.Column<bool>(type: "bit", nullable: false),
                    TotalPoints = table.Column<int>(type: "int", nullable: false),
                    RecognitionsCount = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Morabbi_users_Morabbi_branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Morabbi_branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Morabbi_users_Morabbi_maktabs_MaktabId",
                        column: x => x.MaktabId,
                        principalTable: "Morabbi_maktabs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_daily_reports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InstructorId = table.Column<int>(type: "int", nullable: false),
                    BranchId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(300)", nullable: false),
                    Summary = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReportPattern = table.Column<string>(type: "nvarchar(100)", nullable: true),
                    ReportStyle = table.Column<string>(type: "nvarchar(100)", nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Recommendations = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Audience = table.Column<string>(type: "nvarchar(300)", nullable: true),
                    AttendeesCount = table.Column<int>(type: "int", nullable: false),
                    QuranRefs = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HadithRefs = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Challenges = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Solutions = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PedagogicalNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Attachments = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TranscriptionSource = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    TranscriptionConfidence = table.Column<double>(type: "float", nullable: true),
                    PlanType = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    Approach = table.Column<string>(type: "nvarchar(100)", nullable: true),
                    TraineeCount = table.Column<int>(type: "int", nullable: false),
                    StagePresentation = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StageThinking = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StageDiscussion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StageReporting = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GroupEndurance = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GroupSemiSpeed = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GroupSpeed = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EvaluationSelf = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EvaluationResult = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    EvaluatorId = table.Column<int>(type: "int", nullable: true),
                    EvaluatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_daily_reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Morabbi_daily_reports_Morabbi_branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Morabbi_branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Morabbi_daily_reports_Morabbi_users_EvaluatorId",
                        column: x => x.EvaluatorId,
                        principalTable: "Morabbi_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Morabbi_daily_reports_Morabbi_users_InstructorId",
                        column: x => x.InstructorId,
                        principalTable: "Morabbi_users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_evaluations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TargetType = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    TargetId = table.Column<int>(type: "int", nullable: false),
                    EvaluatorId = table.Column<int>(type: "int", nullable: false),
                    Scores = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OverallComment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_evaluations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Morabbi_evaluations_Morabbi_users_EvaluatorId",
                        column: x => x.EvaluatorId,
                        principalTable: "Morabbi_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_lesson_plans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InstructorId = table.Column<int>(type: "int", nullable: false),
                    BranchId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(300)", nullable: false),
                    Grade = table.Column<string>(type: "nvarchar(100)", nullable: true),
                    SessionCount = table.Column<int>(type: "int", nullable: false),
                    GeneralObjective = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Objectives = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BehavioralObjectives = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SubHeadings = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Prerequisites = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DiagnosticEvaluation = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PreparationPhase = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IntroductionPhase = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PresentationPhase = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SummaryPhase = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EvaluationPhase = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupplementaryActivities = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TeachingMethod = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TeachingAids = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EvaluationQuestions = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContentOutline = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EvaluationMethod = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    QuranRefs = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HadithRefs = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Sources = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PlanType = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    Approach = table.Column<string>(type: "nvarchar(100)", nullable: true),
                    TraineeCount = table.Column<int>(type: "int", nullable: false),
                    StagePresentation = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StageThinking = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StageDiscussion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StageReporting = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GroupEndurance = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GroupSemiSpeed = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GroupSpeed = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EvaluationSelf = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EvaluationResult = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    EvaluatorId = table.Column<int>(type: "int", nullable: true),
                    EvaluatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_lesson_plans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Morabbi_lesson_plans_Morabbi_branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Morabbi_branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Morabbi_lesson_plans_Morabbi_users_EvaluatorId",
                        column: x => x.EvaluatorId,
                        principalTable: "Morabbi_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Morabbi_lesson_plans_Morabbi_users_InstructorId",
                        column: x => x.InstructorId,
                        principalTable: "Morabbi_users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Payload = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Morabbi_notifications_Morabbi_users_UserId",
                        column: x => x.UserId,
                        principalTable: "Morabbi_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_point_transactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    BranchId = table.Column<int>(type: "int", nullable: true),
                    Amount = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    SourceType = table.Column<string>(type: "nvarchar(50)", nullable: true),
                    SourceId = table.Column<string>(type: "nvarchar(100)", nullable: true),
                    AwardedBy = table.Column<string>(type: "nvarchar(200)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_point_transactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Morabbi_point_transactions_Morabbi_branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Morabbi_branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Morabbi_point_transactions_Morabbi_users_UserId",
                        column: x => x.UserId,
                        principalTable: "Morabbi_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Morabbi_recognitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    BranchId = table.Column<int>(type: "int", nullable: true),
                    Level = table.Column<string>(type: "nvarchar(50)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", nullable: true),
                    Period = table.Column<string>(type: "nvarchar(100)", nullable: true),
                    AwardedBy = table.Column<string>(type: "nvarchar(200)", nullable: true),
                    AiSuggested = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Morabbi_recognitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Morabbi_recognitions_Morabbi_branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Morabbi_branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Morabbi_recognitions_Morabbi_users_UserId",
                        column: x => x.UserId,
                        principalTable: "Morabbi_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_branches_Code",
                table: "Morabbi_branches",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_branches_MaktabId",
                table: "Morabbi_branches",
                column: "MaktabId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_daily_reports_BranchId",
                table: "Morabbi_daily_reports",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_daily_reports_EvaluatorId",
                table: "Morabbi_daily_reports",
                column: "EvaluatorId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_daily_reports_InstructorId",
                table: "Morabbi_daily_reports",
                column: "InstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_evaluations_EvaluatorId",
                table: "Morabbi_evaluations",
                column: "EvaluatorId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_evaluations_TargetType_TargetId",
                table: "Morabbi_evaluations",
                columns: new[] { "TargetType", "TargetId" });

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_lesson_plans_BranchId",
                table: "Morabbi_lesson_plans",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_lesson_plans_EvaluatorId",
                table: "Morabbi_lesson_plans",
                column: "EvaluatorId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_lesson_plans_InstructorId",
                table: "Morabbi_lesson_plans",
                column: "InstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_maktabs_Code",
                table: "Morabbi_maktabs",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_maktabs_Name",
                table: "Morabbi_maktabs",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_notifications_UserId",
                table: "Morabbi_notifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_point_transactions_BranchId",
                table: "Morabbi_point_transactions",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_point_transactions_UserId",
                table: "Morabbi_point_transactions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_recognitions_BranchId",
                table: "Morabbi_recognitions",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_recognitions_UserId",
                table: "Morabbi_recognitions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_users_BranchId",
                table: "Morabbi_users",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_users_MaktabId",
                table: "Morabbi_users",
                column: "MaktabId");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_users_NationalId",
                table: "Morabbi_users",
                column: "NationalId",
                unique: true,
                filter: "[NationalId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Morabbi_users_Phone",
                table: "Morabbi_users",
                column: "Phone",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Morabbi_daily_reports");

            migrationBuilder.DropTable(
                name: "Morabbi_evaluation_criteria");

            migrationBuilder.DropTable(
                name: "Morabbi_evaluations");

            migrationBuilder.DropTable(
                name: "Morabbi_lesson_plans");

            migrationBuilder.DropTable(
                name: "Morabbi_notifications");

            migrationBuilder.DropTable(
                name: "Morabbi_point_transactions");

            migrationBuilder.DropTable(
                name: "Morabbi_recognitions");

            migrationBuilder.DropTable(
                name: "Morabbi_users");

            migrationBuilder.DropTable(
                name: "Morabbi_branches");

            migrationBuilder.DropTable(
                name: "Morabbi_maktabs");
        }
    }
}
