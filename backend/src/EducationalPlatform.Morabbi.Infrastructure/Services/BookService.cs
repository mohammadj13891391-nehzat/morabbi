using EducationalPlatform.Morabbi.Application.DTOs;
using EducationalPlatform.Morabbi.Application.Interfaces;
using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EducationalPlatform.Morabbi.Infrastructure.Services;

public class BookService : IBookService
{
    private static readonly string[] ValidLoops = { Book.LoopMabani, Book.LoopTasis, Book.LoopTaali };

    private readonly AppDbContext _db;

    public BookService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<BookSummaryDto>> SearchAsync(string? q, string? loop)
    {
        var query = _db.Books.Where(b => b.IsActive).AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var qTrim = q.Trim();
            query = query.Where(b => b.Title.Contains(qTrim)
                || (b.Author != null && b.Author.Contains(qTrim))
                || (b.Description != null && b.Description.Contains(qTrim))
                || b.Content.Contains(qTrim));
        }
        if (!string.IsNullOrWhiteSpace(loop))
        {
            query = query.Where(b => b.Loops == "" || b.Loops.Contains(loop));
        }
        var books = await query.OrderByDescending(b => b.UpdatedAt).Take(200).ToListAsync();
        return books.Select(ToSummary).ToList();
    }

    public async Task<BookDetailDto> GetAsync(int id)
    {
        var book = await _db.Books.FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("کتاب یافت نشد.");
        return ToDetail(book);
    }

    public async Task<Book> CreateAsync(CreateBookRequest request)
    {
        var book = new Book
        {
            Title = request.Title.Trim(),
            Author = request.Author,
            Category = request.Category,
            Description = request.Description,
            Content = request.Content ?? string.Empty,
            Loops = NormalizeLoops(request.Loops)
        };
        _db.Books.Add(book);
        await _db.SaveChangesAsync();
        return book;
    }

    public async Task<Book> UpdateAsync(int id, UpdateBookRequest request)
    {
        var book = await _db.Books.FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("کتاب یافت نشد.");
        if (!string.IsNullOrWhiteSpace(request.Title)) book.Title = request.Title.Trim();
        book.Author = request.Author ?? book.Author;
        book.Category = request.Category ?? book.Category;
        book.Description = request.Description ?? book.Description;
        if (request.Content is not null) book.Content = request.Content;
        if (request.Loops is not null) book.Loops = NormalizeLoops(request.Loops);
        if (request.IsActive is not null) book.IsActive = request.IsActive.Value;
        book.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return book;
    }

    public async Task DeleteAsync(int id)
    {
        var book = await _db.Books.FirstOrDefaultAsync(b => b.Id == id)
            ?? throw new KeyNotFoundException("کتاب یافت نشد.");
        book.IsActive = false;
        book.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task SetUserLoopAsync(int userId, string loop)
    {
        if (ValidLoops.All(l => !string.Equals(l, loop, StringComparison.Ordinal)))
        {
            throw new ArgumentException("حلقهٔ نامعتبر است.");
        }
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("کاربر یافت نشد.");
        user.TrainingLoop = loop;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private static string NormalizeLoops(List<string>? loops)
    {
        if (loops is null) return string.Empty;
        return string.Join(",", loops
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .Select(l => l.Trim())
            .Where(l => ValidLoops.Any(v => string.Equals(v, l, StringComparison.Ordinal)))
            .Distinct(StringComparer.Ordinal));
    }

    private static BookSummaryDto ToSummary(Book b) => new(
        b.Id, b.Title, b.Author, b.Category, b.Description, b.GetLoops());

    private static BookDetailDto ToDetail(Book b) => new(
        b.Id, b.Title, b.Author, b.Category, b.Description, b.Content, b.GetLoops(), b.IsActive);
}
