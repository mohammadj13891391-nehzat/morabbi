using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Domain.Entities;

namespace EducationalPlatform.Morabbi.Application.Interfaces;

public interface IBranchService
{
    Task<Branch> CreateAsync(CreateBranchRequest request);
    Task<Branch> UpdateAsync(int id, UpdateBranchRequest request);
    Task DeleteAsync(int id);
    Task<List<Branch>> GetAllAsync();
    Task<Branch?> FindByIdAsync(int id);
}

public interface IMaktabService
{
    Task<Maktab> CreateAsync(CreateMaktabRequest request);
    Task<Maktab> UpdateAsync(int id, UpdateMaktabRequest request);
    Task DeleteAsync(int id);
    Task<List<Maktab>> GetAllAsync();
    Task<Maktab?> FindByIdAsync(int id);
}
