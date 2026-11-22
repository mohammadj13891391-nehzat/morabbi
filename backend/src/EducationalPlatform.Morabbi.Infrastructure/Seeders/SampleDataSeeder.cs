using EducationalPlatform.Morabbi.Domain.Entities;
using EducationalPlatform.Morabbi.Infrastructure.Data;
using EducationalPlatform.Morabbi.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EducationalPlatform.Morabbi.Infrastructure.Seeders;

public class SampleDataSeeder
{
    private readonly AppDbContext _db;
    private readonly ILogger<SampleDataSeeder> _logger;

    public SampleDataSeeder(AppDbContext db, ILogger<SampleDataSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        await SeedReferenceCatalogsAsync();
        if (await _db.Branches.AnyAsync()) return;

        var maktabs = new[]
        {
            new Maktab { Name = "مکتب حضرت علی اصغر علیه‌السلام", Code = "MAKTAB-ASQAR", Description = "ویژه برادران" },
            new Maktab { Name = "مکتب حضرت قاسم علیه‌السلام", Code = "MAKTAB-QASEM", Description = "ویژه برادران" },
            new Maktab { Name = "مکتب حضرت رقیه علیها‌السلام", Code = "MAKTAB-RQIYEH", Description = "ویژه خواهران" },
            new Maktab { Name = "مکتب حضرت سکینه علیها‌السلام", Code = "MAKTAB-SAKINEH", Description = "ویژه خواهران" }
        };
        _db.Maktabs.AddRange(maktabs);
        await _db.SaveChangesAsync();

        var branches = new[]
        {
            new Branch { Name = "شعبه شهید بهشتی", Code = "BOYS-BEHESHTI", IsBoys = true, MaktabId = 1 },
            new Branch { Name = "شعبه شهید باهنر", Code = "BOYS-BAHONAR", IsBoys = true, MaktabId = 2 },
            new Branch { Name = "شعبه شهید صدر", Code = "BOYS-SADR", IsBoys = true, MaktabId = 2 },
            new Branch { Name = "شعبه بانو حدادیان", Code = "GIRLS-HADADIAN", IsBoys = false, MaktabId = 3 },
            new Branch { Name = "شعبه بانو طاهایی", Code = "GIRLS-TAHAEE", IsBoys = false, MaktabId = 4 },
            new Branch { Name = "شعبه بانو امین", Code = "GIRLS-AMIN", IsBoys = false, MaktabId = 4 }
        };
        _db.Branches.AddRange(branches);
        await _db.SaveChangesAsync();

        var rubric = "[\"عالی\",\"متوسط\",\"ضعیف\"]";
        var reportCriteria = new (string Title, string? Description, int Weight)[]
        {
            ("عنوان و سرلوحه گزارش", "عنوان شامل موضوع، تاریخ، نویسنده", 2),
            ("چکیده گزارش", "نکات مهم و نتیجه‌گیری کوتاه", 2),
            ("بدنه گزارش (تقسیم‌بندی)", "بخش‌بندی موضوعات", 3),
            ("توصیه‌ها و پیشنهادات", "راهکار برای ادامه کار", 2),
            ("انتخاب الگوی مناسب", "تقدّم/قیاسی/استقرایی", 2),
            ("سبک گزارش", "توصیفی/تحلیلی/انتقادی/تجویزی", 2),
            ("دقت محتوایی و نگارشی", "بدون غلط املایی", 2),
            ("ظاهر حرفه‌ای", "گزارش حرفه‌ای", 1),
            ("بهره‌وری", "استفاده از ابزارها", 1),
            ("ثبات ساختار", "همخوانی با گزارش‌های قبلی", 1),
            ("کاربردی بودن", "کمک به تصمیم‌گیری", 2),
            ("ذکر منابع اصیل", "قرآن و روایات معتبر", 3),
            ("ثبت چالش‌ها و راهکارها", "چالش‌ها و راهکارها", 2),
            ("ملاحظات تربیتی", "وضعیت یادگیرندگان", 2)
        };
        var planCriteria = new (string Title, string? Description, int Weight)[]
        {
            ("موضوع/عنوان دقیق درس", "عنوان مشخص", 2),
            ("عناوین فرعی", "با ترتیب مناسب", 2),
            ("هدف کلی درس", "در یک جمله", 2),
            ("اهداف جزئی درس", "بر اساس عناوین فرعی", 2),
            ("اهداف رفتاری", "با عملکرد، شرایط، معیار", 3),
            ("تعیین رفتار ورودی", "پیش‌نیازها", 2),
            ("ارزشیابی تشخیصی", "سؤال‌های پیش‌نیاز", 2),
            ("مرحله آمادگی", "آمادگی مربی و متربی", 2),
            ("مرحله معرفی", "معرفی و بیان اهداف", 1),
            ("مرحله ارائه درس", "محتوا، روش، زمان", 3),
            ("مرحله خلاصه", "جمع‌بندی", 1),
            ("مرحله ارزشیابی", "بر اساس اهداف رفتاری", 2),
            ("فعالیت‌های تکمیلی", "خارج از حلقه", 1),
            ("روش تدریس", "روش مشخص", 2),
            ("وسایل آموزشی", "وسایل مورد نیاز", 1),
            ("ذکر منابع اصیل", "قرآن و روایات", 2),
            ("تناسب با سطح مخاطب", "همخوانی با سطح متربی", 2)
        };

        foreach (var c in reportCriteria)
        {
            _db.EvaluationCriteria.Add(new EvaluationCriteria
            {
                Type = "REPORT",
                Title = c.Title,
                Description = c.Description,
                Weight = c.Weight,
                RubricLevels = rubric
            });
        }
        foreach (var c in planCriteria)
        {
            _db.EvaluationCriteria.Add(new EvaluationCriteria
            {
                Type = "LESSON_PLAN",
                Title = c.Title,
                Description = c.Description,
                Weight = c.Weight,
                RubricLevels = rubric
            });
        }
        await _db.SaveChangesAsync();

        var hash = PasswordHasher.Hash("password123");
        var users = new[]
        {
            new MorabbiUser { Name = "مدیر سامانه", Phone = "09120000001", PasswordHash = hash, Role = "admin", ApprovalStatus = "approved" },
            new MorabbiUser { Name = "مسئول مرکزی", Phone = "09120000002", PasswordHash = hash, Role = "manager", ApprovalStatus = "approved" },
            new MorabbiUser { Name = "مسئول شعبه", Phone = "09120000003", PasswordHash = hash, Role = "branch_manager", BranchId = 1, ApprovalStatus = "approved" },
            new MorabbiUser { Name = "ارزیاب", Phone = "09120000004", PasswordHash = hash, Role = "evaluator", ApprovalStatus = "approved" },
            new MorabbiUser { Name = "مربی نمونه", Phone = "09120000005", PasswordHash = hash, Role = "coach", BranchId = 1, ApprovalStatus = "approved" }
        };
        _db.Users.AddRange(users);
        await _db.SaveChangesAsync();

        _logger.LogInformation("✅ داده‌های اولیه Morabbi ایجاد شد (۴ مکتب، ۶ شعبه، ۳۱ معیار، ۵ کاربر توسعه)");
    }

    private async Task SeedReferenceCatalogsAsync()
    {
        if (await _db.Methodologies.AnyAsync() && await _db.QuranVerses.AnyAsync() && await _db.Hadiths.AnyAsync()) return;

        if (!await _db.Methodologies.AnyAsync())
        {
            _db.Methodologies.AddRange(
                new Methodology { Name = "روش چهار مرحله‌ای", Desc = "ارائه، تفکر، مباحثه، ارائه به مربی", Steps = "۱. ارائه مطلب به افراد\n۲. تفکر و تأمل در مطلب\n۳. مباحثه و تبادل نظر\n۴. ارائه نتیجه به مربی" },
                new Methodology { Name = "روش سه گروهی", Desc = "استقامتی، نیمه‌سرعتی، سرعتی", Steps = "۱. گروه استقامتی: افراد در مرحله شروع\n۲. گروه نیمه‌سرعتی: افراد در حال پیشرفت\n۳. گروه سرعتی: افراد پیشرفته" },
                new Methodology { Name = "روش سخنرانی فعال", Desc = "ارائه ساختاریافته با مشارکت", Steps = "۱. مقدمه و ایجاد انگیزه\n۲. ارائه محتوای اصلی\n۳. پرسش و پاسخ\n۴. جمع‌بندی و تکلیف" },
                new Methodology { Name = "روش بحث گروهی", Desc = "گفتگوی ساختاریافته", Steps = "۱. تعریف موضوع\n۲. تقسیم گروه‌ها\n۳. بحث با نظارت مربی\n۴. جمع‌بندی" },
                new Methodology { Name = "روش ایفای نقش", Desc = "بازی نقش‌های تربیتی", Steps = "۱. تعریف سناریو\n۲. تخصیص نقش‌ها\n۳. اجرای نقش\n۴. تحلیل و بازخورد" },
                new Methodology { Name = "روش مطالعه موردی", Desc = "تحلیل داستان‌های واقعی", Steps = "۱. ارائه مورد\n۲. تحلیل گروهی\n۳. استخراج درس‌ها\n۴. تطبیق با زندگی" },
                new Methodology { Name = "روش پروژه محور", Desc = "انجام پروژه عملی", Steps = "۱. تعریف پروژه\n۲. برنامه‌ریزی\n۳. اجرا\n۴. ارائه نتایج" },
                new Methodology { Name = "روش قرآنی", Desc = "استخراج درس از آیات", Steps = "۱. تلاوت آیه\n۲. ترجمه\n۳. تفسیر مختصر\n۴. استخراج درس‌ها و کاربرد" });
            await _db.SaveChangesAsync();
        }

        if (!await _db.QuranVerses.AnyAsync())
        {
            _db.QuranVerses.AddRange(
                new QuranVerse { Surah = "بقره", VerseNo = 153, Text = "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", Topic = "صبر و استقامت" },
                new QuranVerse { Surah = "عصر", VerseNo = 1, Text = "وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ", Topic = "زمان و سرمایه" },
                new QuranVerse { Surah = "فاتحه", VerseNo = 5, Text = "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", Topic = "عبادت و استعانت" },
                new QuranVerse { Surah = "مزمل", VerseNo = 5, Text = "إِنَّ رَبَّكَ يَعْلَمُ أَنَّكَ تَقُومُ أَدْنَى مِن ثُلُثَيِ اللَّيْلِ", Topic = "قیام شب و تهجد" },
                new QuranVerse { Surah = "تغابن", VerseNo = 14, Text = "يَا أَيُّهَا الَّذِينَ آمَنُوا إِنَّ مِنْ أَزْوَاجِكُمْ وَأَوْلَادِكُمْ عَدُوًّا لَّكُمْ فَاحْذَرُوهُمْ", Topic = "دوستی‌های خطرناک" },
                new QuranVerse { Surah = "حجرات", VerseNo = 13, Text = "يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُم مِّن ذَكَرٍ وَأُنثَى", Topic = "برادری اسلامی" },
                new QuranVerse { Surah = "فرقان", VerseNo = 74, Text = "وَالَّذِينَ يَقُولُونَ رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ", Topic = "فرزند صالح" },
                new QuranVerse { Surah = "لقمان", VerseNo = 13, Text = "يَا بُنَيَّ لَا تُشْرِكْ بِاللَّهِ إِنَّ الشِّرْكَ لَظُلْمٌ عَظِيمٌ", Topic = "توحید و شرک" },
                new QuranVerse { Surah = "لقمان", VerseNo = 17, Text = "يَا بُنَيَّ أَقِمِ الصَّلَاةَ وَأْمُرْ بِالْمَعْرُوفِ وَانْهَ عَنِ الْمُنكَرِ", Topic = "امر به معروف" },
                new QuranVerse { Surah = "انفال", VerseNo = 24, Text = "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَجِيبُوا لِلَّهِ وَلِلرَّسُولِ إِذَا دَعَاكُمْ", Topic = "استجابت دعوت خدا" },
                new QuranVerse { Surah = "صف", VerseNo = 2, Text = "يَا أَيُّهَا الَّذِينَ آمَنُوا لِمَ تَقُولُونَ مَا لَا تَفْعَلُونَ", Topic = "عمل به قول" },
                new QuranVerse { Surah = "بقره", VerseNo = 201, Text = "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", Topic = "دعای جامع" },
                new QuranVerse { Surah = "آل عمران", VerseNo = 200, Text = "يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا وَرَابِطُوا", Topic = "صبر و مرابطه" },
                new QuranVerse { Surah = "نور", VerseNo = 31, Text = "وَقُل لِّلْمُؤْمِنَاتِ يَغْضُضْنَ مِنْ أَبْصَارِهِنَّ", Topic = "حجاب و عفاف" },
                new QuranVerse { Surah = "اسراء", VerseNo = 23, Text = "وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا", Topic = "نیکی به والدین" },
                new QuranVerse { Surah = "مائده", VerseNo = 2, Text = "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ ۖ وَلَا تَعَاوَنُوا عَلَى الْإِثْمِ وَالْعُدْوَانِ", Topic = "همکاری در نیکی" },
                new QuranVerse { Surah = "بقره", VerseNo = 195, Text = "وَأَحْسِنُوا ۛ إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ", Topic = "احسان و نیکوکاری" },
                new QuranVerse { Surah = "نساء", VerseNo = 36, Text = "وَاعْبُدُوا اللَّهَ وَلَا تُشْرِكُوا بِهِ شَيْئًا ۖ وَبِالْوَالِدَيْنِ إِحْسَانًا", Topic = "عبادت و نیکی" },
                new QuranVerse { Surah = "نساء", VerseNo = 59, Text = "يَا أَيُّهَا الَّذِينَ آمَنُوا أَطِيعُوا اللَّهَ وَأَطِيعُوا الرَّسُولَ وَأُولِي الْأَمْرِ مِنكُمْ", Topic = "اطاعت از ولی امر" },
                new QuranVerse { Surah = "احزاب", VerseNo = 21, Text = "لَّقَدْ كَانَ لَكُمْ فِي رَسُولِ اللَّهِ أُسْوَةٌ حَسَنَةٌ", Topic = "الگوبرداری از پیامبر" },
                new QuranVerse { Surah = "توبه", VerseNo = 71, Text = "وَالْمُؤْمِنُونَ وَالْمُؤْمِنَاتُ بَعْضُهُمْ أَوْلِيَاءُ بَعْضٍ ۚ يَأْمُرُونَ بِالْمَعْرُوفِ", Topic = "ولایت مؤمنان" },
                new QuranVerse { Surah = "حجرات", VerseNo = 12, Text = "يَا أَيُّهَا الَّذِينَ آمَنُوا اجْتَنِبُوا كَثِيرًا مِّنَ الظَّنِّ", Topic = "پرهیز از بدگمانی" },
                new QuranVerse { Surah = "فرقان", VerseNo = 63, Text = "وَعِبَادُ الرَّحْمَٰنِ الَّذِينَ يَمْشُونَ عَلَى الْأَرْضِ هَوْنًا", Topic = "تواضع و متانت" },
                new QuranVerse { Surah = "ملک", VerseNo = 2, Text = "الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا", Topic = "آزمایش الهی" },
                new QuranVerse { Surah = "زمر", VerseNo = 9, Text = "أَمَّنْ هُوَ قَانِتٌ آنَاءَ اللَّيْلِ سَاجِدًا وَقَائِمًا", Topic = "عبادت شب" },
                new QuranVerse { Surah = "شوری", VerseNo = 13, Text = "شَرَعَ لَكُم مِّنَ الدِّينِ مَا وَصَّىٰ بِهِ نُوحًا", Topic = "وحدت دین الهی" },
                new QuranVerse { Surah = "حدید", VerseNo = 3, Text = "هُوَ الْأَوَّلُ وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ ۖ وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ", Topic = "صفات الهی" },
                new QuranVerse { Surah = "تغابن", VerseNo = 15, Text = "إِنَّمَا أَمْوَالُكُمْ وَأَوْلَادُكُمْ فِتْنَةٌ ۚ وَاللَّهُ عِندَهُ أَجْرٌ عَظِيمٌ", Topic = "آزمایش مال و فرزند" },
                new QuranVerse { Surah = "بقره", VerseNo = 286, Text = "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", Topic = "تکلیف به اندازه توان" },
                new QuranVerse { Surah = "رعد", VerseNo = 28, Text = "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ", Topic = "آرامش با ذکر خدا" });
            await _db.SaveChangesAsync();
        }

        if (!await _db.Hadiths.AnyAsync())
        {
            _db.Hadiths.AddRange(
                new Hadith { Source = "نهج‌البلاغه", Narrator = "امام علی علیه‌السلام", Text = "لا خیر فی قرنٍ لیس فیه نصیحةٌ", Topic = "خیرخواهی و نصیحت" },
                new Hadith { Source = "کافی", Narrator = "امام صادق علیه‌السلام", Text = "کونوا دعاةً للناس بغیر ألسنتکم", Topic = "دعوت عملی" },
                new Hadith { Source = "نهج‌البلاغه", Narrator = "امام علی علیه‌السلام", Text = "من عذل أخاه خفیاً فقد نصحه ومن عذله علانیةً فقد فضحه", Topic = "نصیحت پنهانی" },
                new Hadith { Source = "بحارالانوار", Narrator = "پیامبر اکرم صلی‌الله علیه وآله", Text = "المؤمن أخو المؤمن لا یظلمه ولا یخذله", Topic = "برادری مؤمن" },
                new Hadith { Source = "کافی", Narrator = "امام صادق علیه‌السلام", Text = "من اصطنع الی یتیمٍ اثمر الله عمله بالجنة", Topic = "نیکی به یتیم" },
                new Hadith { Source = "نهج‌البلاغه", Narrator = "امام علی علیه‌السلام", Text = "الصبر صبران: صبر علی ما تکرہ و صبر عمّا تحب", Topic = "صبر در دو حال" },
                new Hadith { Source = "خصال", Narrator = "پیامبر اکرم صلی‌الله علیه وآله", Text = "الجنة تحت أقدام الأمهات", Topic = "احترام مادر" },
                new Hadith { Source = "کافی", Narrator = "امام صادق علیه‌السلام", Text = "لا تکذبوا وإن کنتم فی شدةٍ", Topic = "راستگویی" },
                new Hadith { Source = "نهج‌البلاغه", Narrator = "امام علی علیه‌السلام", Text = "قیمت کل امرئٍ ما یحسنه", Topic = "ارزش انسان به دانش" },
                new Hadith { Source = "بحارالانوار", Narrator = "امام رضا علیه‌السلام", Text = "لا یستکمل المؤمن إیمانه حتی تکون فیه خصالٌ", Topic = "صفات مؤمن کامل" },
                new Hadith { Source = "نهج‌البلاغه", Narrator = "امام علی علیه‌السلام", Text = "من أصلح ما بینه و بین الله أصلح الله ما بینه و بین الناس", Topic = "اصلاح رابطه با خدا" },
                new Hadith { Source = "کافی", Narrator = "امام صادق علیه‌السلام", Text = "إذا أحب الله عبداً نظر إلیه، فإذا نظر إلیه ألقی فی قلبه حبَّ ثلاثٍ: حبَّ الصلاة وحبَّ الصدقة وحبَّ الصیام", Topic = "نشانه‌های محبت خدا" },
                new Hadith { Source = "بحارالانوار", Narrator = "پیامبر اکرم صلی‌الله علیه وآله", Text = "أحب الأعمال إلی الله أدومها وإن قلَّ", Topic = "استمرار در عمل خیر" },
                new Hadith { Source = "نهج‌البلاغه", Narrator = "امام علی علیه‌السلام", Text = "الناس أعداء ما جهلوا", Topic = "دشمنی با ناشناخته" },
                new Hadith { Source = "کافی", Narrator = "امام صادق علیه‌السلام", Text = "من سرَّه أن تکون تجارته رابحة فلیتق الله", Topic = "تقوا و تجارت" },
                new Hadith { Source = "وسائل الشیعة", Narrator = "امام صادق علیه‌السلام", Text = "صلة الرحم تزکی الأعمال و تنمی الأموال و تدفع البلوى", Topic = "صله رحم" },
                new Hadith { Source = "نهج‌البلاغه", Narrator = "امام علی علیه‌السلام", Text = "من ذکر الله أحبَّه الله", Topic = "ذکر خدا و محبت" },
                new Hadith { Source = "بحارالانوار", Narrator = "پیامبر اکرم صلی‌الله علیه وآله", Text = "المسلم من سلم المسلمون من لسانه ویده", Topic = "تعریف مسلمان" },
                new Hadith { Source = "کافی", Narrator = "امام باقر علیه‌السلام", Text = "تمام الاخلاص أن تکون سریرته کعلانیته", Topic = "اخلاص" },
                new Hadith { Source = "نهج‌البلاغه", Narrator = "امام علی علیه‌السلام", Text = "إنّ هذه القلوب تمَلّ کما تَمَلّ الأبدان فابتغوا لها طرائف الحکم", Topic = "تنوع در یادگیری" });
            await _db.SaveChangesAsync();
        }

        _logger.LogInformation("📚 کاتالوگ‌های مرجعی (روش‌ها، آیات، احادیث) seed شد");
    }
}
