using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Domain.Entities;

namespace EducationalPlatform.Morabbi.Application.Interfaces;

public interface IBookService
{
    Task<List<BookSummaryDto>> SearchAsync(string? q, string? loop);
    Task<BookDetailDto> GetAsync(int id);
    Task<Book> CreateAsync(CreateBookRequest request);
    Task<Book> UpdateAsync(int id, UpdateBookRequest request);
    Task DeleteAsync(int id);
    Task SetUserLoopAsync(int userId, string loop);
}
