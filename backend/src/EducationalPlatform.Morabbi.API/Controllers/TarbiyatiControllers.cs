using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api/people")]
public class PeopleController : MorabbiControllerBase
{
    private readonly ITarbiyatiService _svc;
    public PeopleController(IMorabbiUserService userService, ITarbiyatiService svc) : base(userService) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _svc.GetPeopleAsync());

    [HttpPost]
    [Authorize(Roles = RoleNames.StaffRoles)]
    public async Task<IActionResult> Create([FromBody] CreatePersonRequest request)
    {
        try { return Ok(await _svc.CreatePersonAsync(request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = RoleNames.StaffRoles)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePersonRequest request)
    {
        try { return Ok(await _svc.UpdatePersonAsync(id, request)); }
        catch (KeyNotFoundException) { return NotFound(GenericErrorMessages.NotFound); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = RoleNames.StaffRoles)]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _svc.DeletePersonAsync(id); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(GenericErrorMessages.NotFound); }
    }
}

[ApiController]
[Route("api/attendance")]
public class AttendanceController : MorabbiControllerBase
{
    private readonly ITarbiyatiService _svc;
    public AttendanceController(IMorabbiUserService userService, ITarbiyatiService svc) : base(userService) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? date) => Ok(await _svc.GetAttendanceAsync(date));

    [HttpGet("history")]
    public async Task<IActionResult> History([FromQuery] int? personId, [FromQuery] int days) => Ok(await _svc.GetAttendanceHistoryAsync(personId, days));

    [HttpPost]
    [Authorize(Roles = RoleNames.StaffRoles)]
    public async Task<IActionResult> Set([FromBody] SetAttendanceRequest request)
    {
        try { return Ok(await _svc.SetAttendanceAsync(request.PersonId, request.Date ?? "", request.Status)); }
        catch (KeyNotFoundException) { return NotFound(GenericErrorMessages.NotFound); }
    }
}

[ApiController]
[Route("api/sessions")]
public class SessionsController : MorabbiControllerBase
{
    private readonly ITarbiyatiService _svc;
    public SessionsController(IMorabbiUserService userService, ITarbiyatiService svc) : base(userService) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var user = await GetCurrentUserAsync();
        return Ok(await _svc.GetSessionsAsync(user?.Id, IsStaff));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSessionRequest request)
    {
        var user = await GetCurrentUserAsync();
        if (user is null) return Unauthorized();
        try { return Ok(await _svc.CreateSessionAsync(user.Id, request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSessionRequest request)
    {
        try { return Ok(await _svc.UpdateSessionAsync(id, request)); }
        catch (KeyNotFoundException) { return NotFound(GenericErrorMessages.NotFound); }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = RoleNames.StaffRoles)]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _svc.DeleteSessionAsync(id); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(GenericErrorMessages.NotFound); }
    }
}

[ApiController]
[Route("api/tasks")]
public class TasksController : MorabbiControllerBase
{
    private readonly ITarbiyatiService _svc;
    public TasksController(IMorabbiUserService userService, ITarbiyatiService svc) : base(userService) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var user = await GetCurrentUserAsync();
        if (user is null) return Unauthorized();
        return Ok(await _svc.GetTasksAsync(user.Id, IsStaff));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskRequest request)
    {
        var user = await GetCurrentUserAsync();
        if (user is null) return Unauthorized();
        return Ok(await _svc.CreateTaskAsync(user.Id, request));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTaskRequest request)
    {
        try
        {
            return Ok(await _svc.ToggleTaskAsync(id, request.Done ?? false));
        }
        catch (KeyNotFoundException) { return NotFound(GenericErrorMessages.NotFound); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _svc.DeleteTaskAsync(id); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(GenericErrorMessages.NotFound); }
    }
}

[ApiController]
[Route("api/daily-trackers")]
public class DailyTrackersController : MorabbiControllerBase
{
    private readonly ITarbiyatiService _svc;
    public DailyTrackersController(IMorabbiUserService userService, ITarbiyatiService svc) : base(userService) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int days)
    {
        var user = await GetCurrentUserAsync();
        if (user is null) return Unauthorized();
        return Ok(await _svc.GetTrackerAsync(user.Id, days));
    }

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] UpsertTrackerRequest request)
    {
        var user = await GetCurrentUserAsync();
        if (user is null) return Unauthorized();
        return Ok(await _svc.UpsertTrackerAsync(user.Id, request.Date ?? "", request));
    }
}

[ApiController]
[Route("api/methodologies")]
public class MethodologiesController : MorabbiControllerBase
{
    private readonly ITarbiyatiService _svc;
    public MethodologiesController(IMorabbiUserService userService, ITarbiyatiService svc) : base(userService) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _svc.GetMethodologiesAsync());

    [HttpPost]
    [Authorize(Roles = RoleNames.AdminManager)]
    public async Task<IActionResult> Create([FromBody] CreateMethodologyRequest request)
    {
        try { return Ok(await _svc.CreateMethodologyAsync(request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = RoleNames.AdminManager)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMethodologyRequest request)
    {
        try { return Ok(await _svc.UpdateMethodologyAsync(id, request)); }
        catch (KeyNotFoundException) { return NotFound(GenericErrorMessages.NotFound); }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = RoleNames.AdminManager)]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _svc.DeleteMethodologyAsync(id); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(GenericErrorMessages.NotFound); }
    }
}

[ApiController]
[Route("api/quran-verses")]
public class QuranVersesController : MorabbiControllerBase
{
    private readonly ITarbiyatiService _svc;
    public QuranVersesController(IMorabbiUserService userService, ITarbiyatiService svc) : base(userService) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _svc.GetQuranVersesAsync());

    [HttpPost]
    [Authorize(Roles = RoleNames.AdminManager)]
    public async Task<IActionResult> Create([FromBody] CreateQuranVerseRequest request)
    {
        try { return Ok(await _svc.CreateQuranVerseAsync(request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = RoleNames.AdminManager)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateQuranVerseRequest request)
    {
        try { return Ok(await _svc.UpdateQuranVerseAsync(id, request)); }
        catch (KeyNotFoundException) { return NotFound(GenericErrorMessages.NotFound); }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = RoleNames.AdminManager)]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _svc.DeleteQuranVerseAsync(id); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(GenericErrorMessages.NotFound); }
    }
}

[ApiController]
[Route("api/hadiths")]
public class HadithsController : MorabbiControllerBase
{
    private readonly ITarbiyatiService _svc;
    public HadithsController(IMorabbiUserService userService, ITarbiyatiService svc) : base(userService) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _svc.GetHadithsAsync());

    [HttpPost]
    [Authorize(Roles = RoleNames.AdminManager)]
    public async Task<IActionResult> Create([FromBody] CreateHadithRequest request)
    {
        try { return Ok(await _svc.CreateHadithAsync(request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = RoleNames.AdminManager)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateHadithRequest request)
    {
        try { return Ok(await _svc.UpdateHadithAsync(id, request)); }
        catch (KeyNotFoundException) { return NotFound(GenericErrorMessages.NotFound); }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = RoleNames.AdminManager)]
    public async Task<IActionResult> Delete(int id)
    {
        try { await _svc.DeleteHadithAsync(id); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(GenericErrorMessages.NotFound); }
    }
}

public record SetAttendanceRequest(int PersonId, string? Date, string Status);
