using Microsoft.Data.SqlClient;
using Microsoft.Data.Sqlite;
using System.Data;

// Resolve the SQLite dev.db relative to this repo, so the tool works no matter
// where the repo is cloned. Walk up from the tool dir to find the repo root
// (the dir containing "unified/server/prisma/dev.db").
string FindDevDb()
{
    if (args.Length > 0) return args[0];
    var dir = new DirectoryInfo(AppContext.BaseDirectory);
    while (dir != null)
    {
        var candidate = Path.Combine(dir.FullName, "unified", "server", "prisma", "dev.db");
        if (File.Exists(candidate)) return candidate;
        dir = dir.Parent;
    }
    return @"D:\morabbi\unified\server\prisma\dev.db";
}

var sqlitePath = FindDevDb();
var sqlConnStr = args.Length > 1
    ? args[1]
    : @"Server=.;Database=Morabbi_Dev;Trusted_Connection=True;TrustServerCertificate=True;";

Console.OutputEncoding = System.Text.Encoding.UTF8;

var verses = new List<(string Surah, int VerseNo, string TextAr, string? TextFa)>();
var hadiths = new List<(string Source, string Narrator, string TextAr, string? TextFa, string? Topic)>();

await using (var sc = new SqliteConnection($"Data Source={sqlitePath};Mode=ReadOnly;"))
{
    await sc.OpenAsync();

    await using (var vc = new SqliteCommand(
        "SELECT surahNameFa, ayah, textUthmani, textSimple FROM quran_verses ORDER BY surah, ayah", sc))
    await using (var vr = await vc.ExecuteReaderAsync())
    {
        while (await vr.ReadAsync())
            verses.Add((vr.GetString(0), vr.GetInt32(1), vr.GetString(2), vr.GetString(3)));
    }

    await using var hc = new SqliteCommand(
        "SELECT source, COALESCE(narratorChain, ''), textAr, textFa, chapter FROM hadiths ORDER BY source", sc);
    await using var hr = await hc.ExecuteReaderAsync();
    while (await hr.ReadAsync())
    {
        var textFa = hr.IsDBNull(3) ? null : hr.GetString(3);
        var chapter = hr.IsDBNull(4) ? null : hr.GetString(4);
        hadiths.Add((hr.GetString(0), hr.GetString(1), hr.GetString(2), textFa, chapter));
    }
}

Console.WriteLine($"SQLite: {verses.Count} verses, {hadiths.Count} hadiths read");

await using var sql = new SqlConnection(sqlConnStr);
await sql.OpenAsync();
await using var tx = sql.BeginTransaction();

await using (var t = sql.CreateCommand())
{
    t.Transaction = tx;
    t.CommandText = "TRUNCATE TABLE Morabbi_quran_verses; TRUNCATE TABLE Morabbi_hadiths;";
    await t.ExecuteNonQueryAsync();
}

var insV = sql.CreateCommand();
insV.Transaction = tx;
insV.CommandText = "INSERT INTO Morabbi_quran_verses (Surah, VerseNo, TextAr, TextFa, Topic, CreatedAt) VALUES (@s, @v, @a, @f, NULL, GETUTCDATE());";
insV.Parameters.Add("@s", SqlDbType.NVarChar, 100);
insV.Parameters.Add("@v", SqlDbType.Int);
insV.Parameters.Add("@a", SqlDbType.NVarChar, -1);
insV.Parameters.Add("@f", SqlDbType.NVarChar, -1);
foreach (var (surah, verseNo, textAr, textFa) in verses)
{
    insV.Parameters["@s"].Value = surah;
    insV.Parameters["@v"].Value = verseNo;
    insV.Parameters["@a"].Value = textAr;
    insV.Parameters["@f"].Value = (object?)textFa ?? DBNull.Value;
    await insV.ExecuteNonQueryAsync();
}

var insH = sql.CreateCommand();
insH.Transaction = tx;
insH.CommandText = "INSERT INTO Morabbi_hadiths (Source, Narrator, TextAr, TextFa, Topic, CreatedAt) VALUES (@s, @n, @a, @f, @t, GETUTCDATE());";
insH.Parameters.Add("@s", SqlDbType.NVarChar, 200);
insH.Parameters.Add("@n", SqlDbType.NVarChar, 200);
insH.Parameters.Add("@a", SqlDbType.NVarChar, -1);
insH.Parameters.Add("@f", SqlDbType.NVarChar, -1);
insH.Parameters.Add("@t", SqlDbType.NVarChar, 200);
foreach (var (source, narrator, textAr, textFa, topic) in hadiths)
{
    insH.Parameters["@s"].Value = source;
    insH.Parameters["@n"].Value = narrator;
    insH.Parameters["@a"].Value = textAr;
    insH.Parameters["@f"].Value = (object?)textFa ?? DBNull.Value;
    insH.Parameters["@t"].Value = (object?)topic ?? DBNull.Value;
    await insH.ExecuteNonQueryAsync();
}

await tx.CommitAsync();
Console.WriteLine($"SQL Server: {verses.Count} verses + {hadiths.Count} hadiths inserted. Done.");
