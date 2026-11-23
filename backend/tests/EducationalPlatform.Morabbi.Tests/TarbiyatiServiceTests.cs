using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using EducationalPlatform.Morabbi.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Tests;

public class TarbiyatiServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly TarbiyatiService _service;

    public TarbiyatiServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);
        _service = new TarbiyatiService(_db);
    }

    public void Dispose()
    {
        _db.Database.EnsureDeleted();
        _db.Dispose();
    }

    private async Task<MorabbiUser> SeedUserAsync(int totalPoints = 0)
    {
        var user = new MorabbiUser { Name = "Test Coach", Phone = "09120000001", Role = "coach", TotalPoints = totalPoints };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return await _db.Users.FirstAsync(u => u.Phone == "09120000001");
    }

    // ===== Points =====

    [Fact]
    public async Task CreateSessionAsync_Awards3Points()
    {
        var user = await SeedUserAsync();
        await _service.CreateSessionAsync(user.Id, new CreateSessionRequest("جلسه هفتگی", null, null, null, null, null, null, null));

        var fresh = await _db.Users.FirstAsync(u => u.Id == user.Id);
        Assert.Equal(3, fresh.TotalPoints);
        var tx = await _db.PointTransactions.SingleAsync();
        Assert.Equal(3, tx.Amount);
        Assert.Equal("MANUAL_AWARD", tx.Reason);
        Assert.Equal("session", tx.SourceType);
    }

    [Fact]
    public async Task ToggleTaskAsync_Done_Awards1Point_Undo_DoesNotAward()
    {
        var user = await SeedUserAsync();
        var task = await _service.CreateTaskAsync(user.Id, new CreateTaskRequest("کار هفته", "MED", null));
        Assert.Equal(0, (await _db.Users.FirstAsync(u => u.Id == user.Id)).TotalPoints);

        await _service.ToggleTaskAsync(task.Id, true);
        Assert.Equal(1, (await _db.Users.FirstAsync(u => u.Id == user.Id)).TotalPoints);

        await _service.ToggleTaskAsync(task.Id, false);
        Assert.Equal(1, (await _db.Users.FirstAsync(u => u.Id == user.Id)).TotalPoints);
        Assert.Single(await _db.PointTransactions.ToListAsync());
    }

    [Fact]
    public async Task UpsertTrackerAsync_NewItems_AwardOnePointPerNewFlag()
    {
        var user = await SeedUserAsync();
        var date = "2026-02-01";
        var first = new UpsertTrackerRequest(date, SalatFajr: true, SalatZuhr: true, SalatAsr: false,
            SalatMaghrib: false, SalatIsha: false, DhikrMorning: true, DhikrEvening: false,
            Quran: false, Fasting: false, Study: false);
        await _service.UpsertTrackerAsync(user.Id, date, first);
        Assert.Equal(3, (await _db.Users.FirstAsync(u => u.Id == user.Id)).TotalPoints);

        var second = new UpsertTrackerRequest(date, SalatFajr: true, SalatZuhr: true, SalatAsr: false,
            SalatMaghrib: false, SalatIsha: true, DhikrMorning: true, DhikrEvening: false,
            Quran: false, Fasting: false, Study: false);
        await _service.UpsertTrackerAsync(user.Id, date, second);
        Assert.Equal(4, (await _db.Users.FirstAsync(u => u.Id == user.Id)).TotalPoints);

        await _service.UpsertTrackerAsync(user.Id, date, second);
        Assert.Equal(4, (await _db.Users.FirstAsync(u => u.Id == user.Id)).TotalPoints);
        var trackers = await _db.DailyTrackers.ToListAsync();
        Assert.Single(trackers);
    }

    [Fact]
    public async Task CreateSessionAsync_UnknownInstructor_Throws()
    {
        await Assert.ThrowsAnyAsync<Exception>(
            () => _service.CreateSessionAsync(999, new CreateSessionRequest("جلسه", null, null, null, null, null, null, null)));
    }

    // ===== Person CRUD =====

    [Fact]
    public async Task Person_Create_Update_Delete_Works()
    {
        var created = await _service.CreatePersonAsync(new CreatePersonRequest("علی احمدی", "A-1", 12, "09120000000", "ششم", "حلقه الف", null, null));
        Assert.Equal("علی احمدی", created.Name);

        var updated = await _service.UpdatePersonAsync(created.Id, new UpdatePersonRequest(null, null, 13, null, null, null, null, "یادداشت"));
        Assert.Equal(13, updated.Age);
        Assert.Equal("یادداشت", updated.Note);
        Assert.Equal("علی احمدی", updated.Name);

        await _service.DeletePersonAsync(created.Id);
        Assert.Empty(await _db.People.ToListAsync());
    }

    [Fact]
    public async Task Person_UpdateNotFound_ThrowsKeyNotFound()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.UpdatePersonAsync(999, new UpdatePersonRequest("x", null, null, null, null, null, null, null)));
    }

    [Fact]
    public async Task Person_GetPeopleAsync_OrdersByName()
    {
        await _service.CreatePersonAsync(new CreatePersonRequest("ب", null, null, null, null, "", null, null));
        await _service.CreatePersonAsync(new CreatePersonRequest("الف", null, null, null, null, "", null, null));
        var names = (await _service.GetPeopleAsync()).Select(p => p.Name).ToList();
        Assert.Equal("الف", names[0]);
    }

    // ===== Attendance =====

    [Fact]
    public async Task SetAttendanceAsync_SameDate_UpsertsStatus()
    {
        var person = await _service.CreatePersonAsync(new CreatePersonRequest("فرد", null, null, null, null, "", null, null));
        var date = "2026-02-01";
        await _service.SetAttendanceAsync(person.Id, date, "حاضر");
        await _service.SetAttendanceAsync(person.Id, date, "غایب");

        var rows = await _db.Attendances.ToListAsync();
        Assert.Single(rows);
        Assert.Equal("غایب", rows[0].Status);

        var list = await _service.GetAttendanceAsync(date);
        Assert.Single(list);
        Assert.Equal("غایب", list[0].Status);
    }

    // ===== Catalogs =====

    [Fact]
    public async Task Methodology_Create_Update_Delete_Works()
    {
        var created = await _service.CreateMethodologyAsync(new CreateMethodologyRequest("استقلال", "توضیح", "مراحل"));
        var updated = await _service.UpdateMethodologyAsync(created.Id, new UpdateMethodologyRequest("استقلال جدید", null, null));
        Assert.Equal("استقلال جدید", updated.Name);
        Assert.Equal("توضیح", updated.Desc);

        var all = await _service.GetMethodologiesAsync();
        Assert.Single(all);

        await _service.DeleteMethodologyAsync(created.Id);
        Assert.Empty(await _db.Methodologies.ToListAsync());
    }

    [Fact]
    public async Task Methodology_UpdateNotFound_ThrowsKeyNotFound()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.UpdateMethodologyAsync(999, new UpdateMethodologyRequest("x", null, null)));
    }

    [Fact]
    public async Task QuranVerse_OurderedBySurahAndVerseNo()
    {
        await _service.CreateQuranVerseAsync(new CreateQuranVerseRequest("نوح", 5, "آیه ۵", null));
        await _service.CreateQuranVerseAsync(new CreateQuranVerseRequest("نوح", 1, "آیه ۱", null));
        await _service.CreateQuranVerseAsync(new CreateQuranVerseRequest("حشر", 1, "آیه ۱", null));
        var verses = await _service.GetQuranVersesAsync();
        Assert.Equal(new[] { "حشر", "نوح", "نوح" }, verses.Select(v => v.Surah).ToArray());
    }
}
