using EducationalPlatform.Morabbi.Application.Constants;
using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class BranchService : IBranchService
{
    private readonly AppDbContext _db;

    public BranchService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Branch> CreateAsync(CreateBranchRequest request)
    {
        if (await _db.Branches.AnyAsync(b => b.Code == request.Code))
        {
            throw new InvalidOperationException("این کد شعبه قبلاً ثبت شده است.");
        }
        var branch = new Branch
        {
            Name = request.Name,
            Code = request.Code,
            Address = request.Address,
            Phone = request.Phone,
            MaktabId = request.MaktabId,
            IsBoys = request.IsBoys
        };
        _db.Branches.Add(branch);
        await _db.SaveChangesAsync();
        return branch;
    }

    public async Task<Branch> UpdateAsync(int id, UpdateBranchRequest request)
    {
        var branch = await _db.Branches.FindAsync(id)
            ?? throw new KeyNotFoundException("Branch not found");
        if (request.Name is not null) branch.Name = request.Name;
        if (request.Code is not null) branch.Code = request.Code;
        if (request.Address is not null) branch.Address = request.Address;
        if (request.Phone is not null) branch.Phone = request.Phone;
        if (request.MaktabId.HasValue) branch.MaktabId = request.MaktabId;
        if (request.IsBoys.HasValue) branch.IsBoys = request.IsBoys.Value;
        branch.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return branch;
    }

    public async Task DeleteAsync(int id)
    {
        var branch = await _db.Branches.FindAsync(id)
            ?? throw new KeyNotFoundException("Branch not found");
        if (await _db.DailyReports.AnyAsync(r => r.BranchId == id))
        {
            throw new InvalidOperationException("این شعبه گزارش دارد و قابل حذف نیست.");
        }
        _db.Branches.Remove(branch);
        await _db.SaveChangesAsync();
    }

    public async Task<List<Branch>> GetAllAsync()
    {
        return await _db.Branches.Include(b => b.Maktab).OrderBy(b => b.Name).ToListAsync();
    }

    public async Task<Branch?> FindByIdAsync(int id)
    {
        return await _db.Branches.Include(b => b.Maktab).FirstOrDefaultAsync(b => b.Id == id);
    }
}
