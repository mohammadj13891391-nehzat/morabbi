namespace EducationalPlatform.Morabbi.Application.Constants;

public static class RoleNames
{
    public const string Admin = "admin";
    public const string Manager = "manager";
    public const string BranchManager = "branch_manager";
    public const string Coach = "coach";
    public const string InstructorAssistant = "instructor_assistant";
    public const string Evaluator = "evaluator";
    public const string BrothersSkillsSupervisor = "brothers_skills_supervisor";
    public const string SistersSkillsSupervisor = "sisters_skills_supervisor";

    public static readonly string[] All =
    {
        Admin, Manager, BranchManager, Coach, InstructorAssistant,
        Evaluator, BrothersSkillsSupervisor, SistersSkillsSupervisor
    };

    public static readonly string[] Staff =
    {
        Admin, Manager, BranchManager, Evaluator, BrothersSkillsSupervisor, SistersSkillsSupervisor
    };

    public const string StaffRoles = "admin,manager,branch_manager,evaluator,brothers_skills_supervisor,sisters_skills_supervisor";
    public const string AdminManager = "admin,manager";
}
