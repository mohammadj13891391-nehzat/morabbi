using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EducationalPlatform.Morabbi.API.Controllers;

[ApiController]
[Route("api/search")]
public class SearchController : MorabbiControllerBase
{
    private readonly ISearchService _searchService;

    public SearchController(IMorabbiUserService userService, ISearchService searchService)
        : base(userService)
    {
        _searchService = searchService;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] int? perType)
    {
        var current = await GetCurrentUserAsync();
        if (current is null) return Unauthorized(GenericErrorMessages.Unauthorized);
        return Ok(await _searchService.SearchAsync(q, current.Id, current.Role, CurrentBranchId, perType ?? 10));
    }
}
