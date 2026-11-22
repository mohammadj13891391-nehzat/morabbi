using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class MaktabService : IMaktabService
{
    private readonly AppDbContext _db;

    public MaktabService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Maktab> CreateAsync(CreateMaktabRequest request)
    {
        if (await _db.Maktabs.AnyAsync(m => m.Code == request.Code))
        {
            throw new InvalidOperationException("این کد مکتب قبلاً ثبت شده است.");
        }
        var maktab = new Maktab
        {
            Name = request.Name,
            Code = request.Code,
            Description = request.Description,
            Active = request.Active ?? true
        };
        _db.Maktabs.Add(maktab);
        await _db.SaveChangesAsync();
        return maktab;
    }

    public async Task<Maktab> UpdateAsync(int id, UpdateMaktabRequest request)
    {
        var maktab = await _db.Maktabs.FindAsync(id)
            ?? throw new KeyNotFoundException("Maktab not found");
        if (request.Name is not null) maktab.Name = request.Name;
        if (request.Code is not null) maktab.Code = request.Code;
        if (request.Description is not null) maktab.Description = request.Description;
        if (request.Active.HasValue) maktab.Active = request.Active.Value;
        maktab.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return maktab;
    }

    public async Task DeleteAsync(int id)
    {
        var maktab = await _db.Maktabs.FindAsync(id)
            ?? throw new KeyNotFoundException("Maktab not found");
        if (await _db.Branches.AnyAsync(b => b.MaktabId == id))
        {
            throw new InvalidOperationException("این مکتب شعبه دارد و قابل حذف نیست.");
        }
        _db.Maktabs.Remove(maktab);
        await _db.SaveChangesAsync();
    }

    public async Task<List<Maktab>> GetAllAsync()
    {
        return await _db.Maktabs.OrderBy(m => m.Name).ToListAsync();
    }

    public async Task<Maktab?> FindByIdAsync(int id)
    {
        return await _db.Maktabs.FirstOrDefaultAsync(m => m.Id == id);
    }
}
