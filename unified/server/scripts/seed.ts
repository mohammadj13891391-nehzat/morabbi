// Seed script - نهضت تربیتی حضرت سیدالشهدا علیه‌السلام
import { db } from "../src/lib/db.ts";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 شروع پر کردن داده‌های اولیه...\n");

  await db.notification.deleteMany({});
  await db.session.deleteMany({});
  await db.evaluation.deleteMany({});
  await db.aISuggestion.deleteMany({});
  await db.evaluationCriteria.deleteMany({});
  await db.dailyReport.deleteMany({});
  await db.lessonPlan.deleteMany({});
  await db.verificationCode.deleteMany({});
  await db.pointTransaction.deleteMany({});
  await db.recognition.deleteMany({});
  await db.comment.deleteMany({});
  await db.mediaProcessingJob.deleteMany({});
  await db.pushSubscription.deleteMany({});
  await db.quranVerse.deleteMany({});
  await db.hadith.deleteMany({});
  await db.person.deleteMany({});
  await db.sessionMinutes.deleteMany({});
  await db.task.deleteMany({});
  await db.dailyTracker.deleteMany({});
  await db.methodology.deleteMany({});
  await db.user.deleteMany({});
  await db.branch.deleteMany({});
  await db.maktab.deleteMany({});

  // مکتب‌ها
  const maktabs = [
    { name: "مکتب حضرت علی اصغر علیه‌السلام", code: "MAKTAB-ASQAR", description: "ویژه برادران" },
    { name: "مکتب حضرت قاسم علیه‌السلام", code: "MAKTAB-QASEM", description: "ویژه برادران" },
    { name: "مکتب حضرت رقیه علیها‌السلام", code: "MAKTAB-RQIYEH", description: "ویژه خواهران" },
    { name: "مکتب حضرت سکینه علیها‌السلام", code: "MAKTAB-SAKINEH", description: "ویژه خواهران" },
  ];
  const mk: Record<string, string> = {};
  for (const m of maktabs) { const r = await db.maktab.create({ data: m }); mk[m.code] = r.id; console.log(`  ✓ مکتب: ${m.name}`); }

  // شعب
  const branches = [
    { name: "شعبه شهید بهشتی", code: "BOYS-BEHESHTI", isBoys: true, maktabId: mk["MAKTAB-ASQAR"] },
    { name: "شعبه شهید باهنر", code: "BOYS-BAHONAR", isBoys: true, maktabId: mk["MAKTAB-QASEM"] },
    { name: "شعبه شهید صدر", code: "BOYS-SADR", isBoys: true, maktabId: mk["MAKTAB-QASEM"] },
    { name: "شعبه بانو حدادیان", code: "GIRLS-HADADIAN", isBoys: false, maktabId: mk["MAKTAB-RQIYEH"] },
    { name: "شعبه بانو طاهایی", code: "GIRLS-TAHAEE", isBoys: false, maktabId: mk["MAKTAB-SAKINEH"] },
    { name: "شعبه بانو امین", code: "GIRLS-AMIN", isBoys: false, maktabId: mk["MAKTAB-SAKINEH"] },
  ];
  for (const b of branches) { await db.branch.create({ data: b }); console.log(`  ✓ شعبه: ${b.name}`); }

  // معیارهای ارزیابی گزارش (۱۴ معیار)
  const rc = [
    { type: "REPORT" as const, title: "عنوان و سرلوحه گزارش", description: "عنوان شامل موضوع، تاریخ، نویسنده", weight: 2 },
    { type: "REPORT" as const, title: "چکیده گزارش", description: "نکات مهم و نتیجه‌گیری کوتاه", weight: 2 },
    { type: "REPORT" as const, title: "بدنه گزارش (تقسیم‌بندی)", description: "بخش‌بندی موضوعات", weight: 3 },
    { type: "REPORT" as const, title: "توصیه‌ها و پیشنهادات", description: "راهکار برای ادامه کار", weight: 2 },
    { type: "REPORT" as const, title: "انتخاب الگوی مناسب", description: "تقدّم/قیاسی/استقرایی", weight: 2 },
    { type: "REPORT" as const, title: "سبک گزارش", description: "توصیفی/تحلیلی/انتقادی/تجویزی", weight: 2 },
    { type: "REPORT" as const, title: "دقت محتوایی و نگارشی", description: "بدون غلط املایی", weight: 2 },
    { type: "REPORT" as const, title: "ظاهر حرفه‌ای", description: "گزارش حرفه‌ای", weight: 1 },
    { type: "REPORT" as const, title: "بهره‌وری", description: "استفاده از ابزارها", weight: 1 },
    { type: "REPORT" as const, title: "ثبات ساختار", description: "همخوانی با گزارش‌های قبلی", weight: 1 },
    { type: "REPORT" as const, title: "کاربردی بودن", description: "کمک به تصمیم‌گیری", weight: 2 },
    { type: "REPORT" as const, title: "ذکر منابع اصیل", description: "قرآن و روایات معتبر", weight: 3 },
    { type: "REPORT" as const, title: "ثبت چالش‌ها و راهکارها", description: "چالش‌ها و راهکارها", weight: 2 },
    { type: "REPORT" as const, title: "ملاحظات تربیتی", description: "وضعیت یادگیرندگان", weight: 2 },
  ];
  for (const c of rc) await db.evaluationCriteria.create({ data: { ...c, rubricLevels: JSON.stringify(["عالی", "متوسط", "ضعیف"]) } });
  console.log(`  ✓ ${rc.length} معیار ارزیابی گزارش`);

  // معیارهای طرح درس (۱۷ معیار)
  const lc = [
    { type: "LESSON_PLAN" as const, title: "موضوع/عنوان دقیق درس", description: "عنوان مشخص", weight: 2 },
    { type: "LESSON_PLAN" as const, title: "عناوین فرعی", description: "با ترتیب مناسب", weight: 2 },
    { type: "LESSON_PLAN" as const, title: "هدف کلی درس", description: "در یک جمله", weight: 2 },
    { type: "LESSON_PLAN" as const, title: "اهداف جزئی درس", description: "بر اساس عناوین فرعی", weight: 2 },
    { type: "LESSON_PLAN" as const, title: "اهداف رفتاری", description: "با عملکرد، شرایط، معیار", weight: 3 },
    { type: "LESSON_PLAN" as const, title: "تعیین رفتار ورودی", description: "پیش‌نیازها", weight: 2 },
    { type: "LESSON_PLAN" as const, title: "ارزشیابی تشخیصی", description: "سؤال‌های پیش‌نیاز", weight: 2 },
    { type: "LESSON_PLAN" as const, title: "مرحله آمادگی", description: "آمادگی مربی و متربی", weight: 2 },
    { type: "LESSON_PLAN" as const, title: "مرحله معرفی", description: "معرفی و بیان اهداف", weight: 1 },
    { type: "LESSON_PLAN" as const, title: "مرحله ارائه درس", description: "محتوا، روش، زمان", weight: 3 },
    { type: "LESSON_PLAN" as const, title: "مرحله خلاصه", description: "جمع‌بندی", weight: 1 },
    { type: "LESSON_PLAN" as const, title: "مرحله ارزشیابی", description: "بر اساس اهداف رفتاری", weight: 2 },
    { type: "LESSON_PLAN" as const, title: "فعالیت‌های تکمیلی", description: "خارج از حلقه", weight: 1 },
    { type: "LESSON_PLAN" as const, title: "روش تدریس", description: "روش مشخص", weight: 2 },
    { type: "LESSON_PLAN" as const, title: "وسایل آموزشی", description: "وسایل مورد نیاز", weight: 1 },
    { type: "LESSON_PLAN" as const, title: "ذکر منابع اصیل", description: "قرآن و روایات", weight: 2 },
    { type: "LESSON_PLAN" as const, title: "تناسب با سطح مخاطب", description: "همخوانی با سطح متربی", weight: 2 },
  ];
  for (const c of lc) await db.evaluationCriteria.create({ data: { ...c, rubricLevels: JSON.stringify(["عالی", "متوسط", "ضعیف"]) } });
  console.log(`  ✓ ${lc.length} معیار ارزیابی طرح درس`);

  // معیارهای v23 (۱۵ معیار — همان‌هایی که اپلیکیشن موبایل استفاده می‌کند)
  const v23c = [
    { type: "REPORT" as const, title: "استفاده از روش چهار مرحله‌ای", description: "ارائه، تفکر، مباحثه، ارائه به مربی", weight: 10 },
    { type: "REPORT" as const, title: "تفکیک سه گروه (استقامتی، نیمه‌سرعتی، سرعتی)", description: "گروه‌بندی متربیان", weight: 10 },
    { type: "REPORT" as const, title: "ارائه محتوای غنی و مستند", description: "محتوای کامل با منابع", weight: 10 },
    { type: "REPORT" as const, title: "خودارزیابی صادقانه", description: "ارزیابی خود مربی", weight: 5 },
    { type: "REPORT" as const, title: "نظم و انسجام گزارش", description: "ساختار منظم", weight: 5 },
    { type: "REPORT" as const, title: "پیگیری تکالیف", description: "تکالیف قبلی پیگیری شده باشد", weight: 5 },
    { type: "LESSON_PLAN" as const, title: "استفاده از آیات قرآن", description: "آیات مرتبط", weight: 10 },
    { type: "LESSON_PLAN" as const, title: "استفاده از احادیث", description: "روایات مرتبط", weight: 10 },
    { type: "LESSON_PLAN" as const, title: "تناسب با پایه تحصیلی", description: "هماهنگ با سطح", weight: 10 },
    { type: "LESSON_PLAN" as const, title: "اهداف رفتاری روشن", description: "اهداف مشخص", weight: 5 },
    { type: "LESSON_PLAN" as const, title: "مراحل تدریس منطقی", description: "ترتیب منطقی", weight: 10 },
    { type: "LESSON_PLAN" as const, title: "ارزشیابی تشخیصی و پایانی", description: "پیش و پس از درس", weight: 5 },
  ];
  for (const c of v23c) await db.evaluationCriteria.create({ data: { ...c, rubricLevels: JSON.stringify(["عالی", "متوسط", "ضعیف"]), definedBy: "v23" } });
  console.log(`  ✓ ${v23c.length} معیار ارزیابی (الگوی v23)`);

  // روش‌های تدریس (۸ روش — همان v23)
  const methodologies = [
    { name: "روش چهار مرحله‌ای", desc: "ارائه، تفکر، مباحثه، ارائه به مربی", steps: "۱. ارائه مطلب به افراد\n۲. تفکر و تأمل در مطلب\n۳. مباحثه و تبادل نظر\n۴. ارائه نتیجه به مربی" },
    { name: "روش سه گروهی", desc: "استقامتی، نیمه‌سرعتی، سرعتی", steps: "۱. گروه استقامتی: افراد در مرحله شروع\n۲. گروه نیمه‌سرعتی: افراد در حال پیشرفت\n۳. گروه سرعتی: افراد پیشرفته" },
    { name: "روش سخنرانی فعال", desc: "ارائه ساختاریافته با مشارکت", steps: "۱. مقدمه و ایجاد انگیزه\n۲. ارائه محتوای اصلی\n۳. پرسش و پاسخ\n۴. جمع‌بندی و تکلیف" },
    { name: "روش بحث گروهی", desc: "گفتگوی ساختاریافته", steps: "۱. تعریف موضوع\n۲. تقسیم گروه‌ها\n۳. بحث با نظارت مربی\n۴. جمع‌بندی" },
    { name: "روش ایفای نقش", desc: "بازی نقش‌های تربیتی", steps: "۱. تعریف سناریو\n۲. تخصیص نقش‌ها\n۳. اجرای نقش\n۴. تحلیل و بازخورد" },
    { name: "روش مطالعه موردی", desc: "تحلیل داستان‌های واقعی", steps: "۱. ارائه مورد\n۲. تحلیل گروهی\n۳. استخراج درس‌ها\n۴. تطبیق با زندگی" },
    { name: "روش پروژه محور", desc: "انجام پروژه عملی", steps: "۱. تعریف پروژه\n۲. برنامه‌ریزی\n۳. اجرا\n۴. ارائه نتایج" },
    { name: "روش قرآنی", desc: "استخراج درس از آیات", steps: "۱. تلاوت آیه\n۲. ترجمه\n۳. تفسیر مختصر\n۴. استخراج درس‌ها و کاربرد" },
  ];
  for (const m of methodologies) await db.methodology.create({ data: m });
  console.log(`  ✓ ${methodologies.length} روش تدریس (الگوی v23)`);

  // چند آیه قرآن نمونه
  const quranSamples = [
    { id: 5610, surah: 56, ayah: 10, surahName: "Al-Waqi'ah", surahNameFa: "واقعه", textSimple: "والسابقون السابقون", textUthmani: "وَٱلسَّابِقُونَ ٱلسَّابِقُونَ", juz: 27, page: 536 },
    { id: 5611, surah: 56, ayah: 11, surahName: "Al-Waqi'ah", surahNameFa: "واقعه", textSimple: "أولئك المقربون", textUthmani: "أُولَٰئِكَ ٱلْمُقَرَّبُونَ", juz: 27, page: 536 },
    { id: 2148, surah: 2, ayah: 148, surahName: "Al-Baqarah", surahNameFa: "بقره", textSimple: "فاستبقوا الخيرات", textUthmani: "فَٱسْتَبِقُوا۟ ٱلْخَيْرَٰتِ", juz: 16, page: 23 },
  ];
  for (const v of quranSamples) await db.quranVerse.create({ data: v });
  console.log(`  ✓ ${quranSamples.length} آیه قرآن نمونه`);

  // ۳۰ آیه v23 (همان مجموعه‌ای که در اپ موبایل است)
  const quranV23 = [
    { id: 2153, surah: 2, ayah: 153, surahName: "Al-Baqarah", surahNameFa: "بقره", text: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", topic: "صبر و استقامت" },
    { id: 1031, surah: 103, ayah: 1, surahName: "Al-Asr", surahNameFa: "عصر", text: "وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ", topic: "زمان و سرمایه" },
    { id: 1005, surah: 1, ayah: 5, surahName: "Al-Fatihah", surahNameFa: "فاتحه", text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", topic: "عبادت و استعانت" },
    { id: 73005, surah: 73, ayah: 5, surahName: "Al-Muzzammil", surahNameFa: "مزمل", text: "إِنَّ رَبَّكَ يَعْلَمُ أَنَّكَ تَقُومُ أَدْنَى مِن ثُلُثَيِ اللَّيْلِ", topic: "قیام شب و تهجد" },
    { id: 64014, surah: 64, ayah: 14, surahName: "At-Taghabun", surahNameFa: "تغابن", text: "يَا أَيُّهَا الَّذِينَ آمَنُوا إِنَّ مِنْ أَزْوَاجِكُمْ وَأَوْلَادِكُمْ عَدُوًّا لَّكُمْ فَاحْذَرُوهُمْ", topic: "دوستی‌های خطرناک" },
    { id: 49013, surah: 49, ayah: 13, surahName: "Al-Hujurat", surahNameFa: "حجرات", text: "يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُم مِّن ذَكَرٍ وَأُنثَىٰ", topic: "برادری اسلامی" },
    { id: 25074, surah: 25, ayah: 74, surahName: "Al-Furqan", surahNameFa: "فرقان", text: "وَالَّذِينَ يَقُولُونَ رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ", topic: "فرزند صالح" },
    { id: 31013, surah: 31, ayah: 13, surahName: "Luqman", surahNameFa: "لقمان", text: "يَا بُنَيَّ لَا تُشْرِكْ بِاللَّهِ إِنَّ الشِّرْكَ لَظُلْمٌ عَظِيمٌ", topic: "توحید و شرک" },
    { id: 31017, surah: 31, ayah: 17, surahName: "Luqman", surahNameFa: "لقمان", text: "يَا بُنَيَّ أَقِمِ الصَّلَاةَ وَأْمُرْ بِالْمَعْرُوفِ وَانْهَ عَنِ الْمُنكَرِ", topic: "امر به معروف" },
    { id: 8024, surah: 8, ayah: 24, surahName: "Al-Anfal", surahNameFa: "انفال", text: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَجِيبُوا لِلَّهِ وَلِلرَّسُولِ إِذَا دَعَاكُمْ", topic: "استجابت دعوت خدا" },
    { id: 61002, surah: 61, ayah: 2, surahName: "As-Saff", surahNameFa: "صف", text: "يَا أَيُّهَا الَّذِينَ آمَنُوا لِمَ تَقُولُونَ مَا لَا تَفْعَلُونَ", topic: "عمل به قول" },
    { id: 2201, surah: 2, ayah: 201, surahName: "Al-Baqarah", surahNameFa: "بقره", text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", topic: "دعای جامع" },
    { id: 3200, surah: 3, ayah: 200, surahName: "Aal-Imran", surahNameFa: "آل عمران", text: "يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا وَرَابِطُوا", topic: "صبر و مرابطه" },
    { id: 24031, surah: 24, ayah: 31, surahName: "An-Nur", surahNameFa: "نور", text: "وَقُل لِّلْمُؤْمِنَاتِ يَغْضُضْنَ مِنْ أَبْصَارِهِنَّ", topic: "حجاب و عفاف" },
    { id: 17023, surah: 17, ayah: 23, surahName: "Al-Isra", surahNameFa: "اسراء", text: "وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا", topic: "نیکی به والدین" },
    { id: 5002, surah: 5, ayah: 2, surahName: "Al-Ma'idah", surahNameFa: "مائده", text: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ ۖ وَلَا تَعَاوَنُوا عَلَى الْإِثْمِ وَالْعُدْوَانِ", topic: "همکاری در نیکی" },
    { id: 2195, surah: 2, ayah: 195, surahName: "Al-Baqarah", surahNameFa: "بقره", text: "وَأَحْسِنُوا ۛ إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ", topic: "احسان و نیکوکاری" },
    { id: 4036, surah: 4, ayah: 36, surahName: "An-Nisa", surahNameFa: "نساء", text: "وَاعْبُدُوا اللَّهَ وَلَا تُشْرِكُوا بِهِ شَيْئًا ۖ وَبِالْوَالِدَيْنِ إِحْسَانًا", topic: "عبادت و نیکی" },
    { id: 4059, surah: 4, ayah: 59, surahName: "An-Nisa", surahNameFa: "نساء", text: "يَا أَيُّهَا الَّذِينَ آمَنُوا أَطِيعُوا اللَّهَ وَأَطِيعُوا الرَّسُولَ وَأُولِي الْأَمْرِ مِنكُمْ", topic: "اطاعت از ولی امر" },
    { id: 33021, surah: 33, ayah: 21, surahName: "Al-Ahzab", surahNameFa: "احزاب", text: "لَّقَدْ كَانَ لَكُمْ فِي رَسُولِ اللَّهِ أُسْوَةٌ حَسَنَةٌ", topic: "الگوبرداری از پیامبر" },
    { id: 9071, surah: 9, ayah: 71, surahName: "At-Tawbah", surahNameFa: "توبه", text: "وَالْمُؤْمِنُونَ وَالْمُؤْمِنَاتُ بَعْضُهُمْ أَوْلِيَاءُ بَعْضٍ ۚ يَأْمُرُونَ بِالْمَعْرُوفِ", topic: "ولایت مؤمنان" },
    { id: 49012, surah: 49, ayah: 12, surahName: "Al-Hujurat", surahNameFa: "حجرات", text: "يَا أَيُّهَا الَّذِينَ آمَنُوا اجْتَنِبُوا كَثِيرًا مِّنَ الظَّنِّ", topic: "پرهیز از بدگمانی" },
    { id: 25063, surah: 25, ayah: 63, surahName: "Al-Furqan", surahNameFa: "فرقان", text: "وَعِبَادُ الرَّحْمَٰنِ الَّذِينَ يَمْشُونَ عَلَى الْأَرْضِ هَوْنًا", topic: "تواضع و متانت" },
    { id: 67002, surah: 67, ayah: 2, surahName: "Al-Mulk", surahNameFa: "ملک", text: "الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا", topic: "آزمایش الهی" },
    { id: 39009, surah: 39, ayah: 9, surahName: "Az-Zumar", surahNameFa: "زمر", text: "أَمَّنْ هُوَ قَانِتٌ آنَاءَ اللَّيْلِ سَاجِدًا وَقَائِمًا", topic: "عبادت شب" },
    { id: 42013, surah: 42, ayah: 13, surahName: "Ash-Shura", surahNameFa: "شوری", text: "شَرَعَ لَكُم مِّنَ الدِّينِ مَا وَصَّىٰ بِهِ نُوحًا", topic: "وحدت دین الهی" },
    { id: 57003, surah: 57, ayah: 3, surahName: "Al-Hadid", surahNameFa: "حدید", text: "هُوَ الْأَوَّلُ وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ ۖ وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ", topic: "صفات الهی" },
    { id: 64015, surah: 64, ayah: 15, surahName: "At-Taghabun", surahNameFa: "تغابن", text: "إِنَّمَا أَمْوَالُكُمْ وَأَوْلَادُكُمْ فِتْنَةٌ ۚ وَاللَّهُ عِندَهُ أَجْرٌ عَظِيمٌ", topic: "آزمایش مال و فرزند" },
    { id: 2286, surah: 2, ayah: 286, surahName: "Al-Baqarah", surahNameFa: "بقره", text: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", topic: "تکلیف به اندازه توان" },
    { id: 13028, surah: 13, ayah: 28, surahName: "Ar-Ra'd", surahNameFa: "رعد", text: "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ", topic: "آرامش با ذکر خدا" },
  ];
  const norm = (s: string) => s.replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي");
  for (const v of quranV23) await db.quranVerse.upsert({ where: { id: v.id }, update: {}, create: { id: v.id, surah: v.surah, ayah: v.ayah, surahName: v.surahName, surahNameFa: v.surahNameFa, textSimple: norm(v.text), textUthmani: v.text, juz: 0, page: 0 } });
  console.log(`  ✓ ${quranV23.length} آیه قرآن (مجموعه v23)`);

  // ۲۰ روایت v23
  const hadithsV23 = [
    { source: "نهج‌البلاغه", narratorChain: "امام علی علیه‌السلام", textAr: "لا خیر فی قرنٍ لیس فیه نصیحةٌ", subjectTags: JSON.stringify(["نصیحت"]) },
    { source: "کافی", narratorChain: "امام صادق علیه‌السلام", textAr: "کونوا دعاةً للناس بغیر ألسنتکم", subjectTags: JSON.stringify(["دعوت"]) },
    { source: "نهج‌البلاغه", narratorChain: "امام علی علیه‌السلام", textAr: "من عذل أخاه خفیاً فقد نصحه ومن عذله علانیةً فقد فضحه", subjectTags: JSON.stringify(["نصیحت"]) },
    { source: "بحارالانوار", narratorChain: "پیامبر اکرم صلی‌الله علیه وآله", textAr: "المؤمن أخو المؤمن لا یظلمه ولا یخذله", subjectTags: JSON.stringify(["برادری"]) },
    { source: "کافی", narratorChain: "امام صادق علیه‌السلام", textAr: "من اصطنع الی یتیمٍ اثمر الله عمله بالجنة", subjectTags: JSON.stringify(["یتیم"]) },
    { source: "نهج‌البلاغه", narratorChain: "امام علی علیه‌السلام", textAr: "الصبر صبران: صبر علی ما تکره و صبر عمّا تحب", subjectTags: JSON.stringify(["صبر"]) },
    { source: "خصال", narratorChain: "پیامبر اکرم صلی‌الله علیه وآله", textAr: "الجنة تحت أقدام الأمهات", subjectTags: JSON.stringify(["مادر"]) },
    { source: "کافی", narratorChain: "امام صادق علیه‌السلام", textAr: "لا تکذبوا وإن کنتم فی شدةٍ", subjectTags: JSON.stringify(["راستگویی"]) },
    { source: "نهج‌البلاغه", narratorChain: "امام علی علیه‌السلام", textAr: "قیمت کل امرئٍ ما یحسنه", subjectTags: JSON.stringify(["دانش"]) },
    { source: "بحارالانوار", narratorChain: "امام رضا علیه‌السلام", textAr: "لا یستکمل المؤمن إیمانه حتی تکون فیه خصالٌ", subjectTags: JSON.stringify(["ایمان"]) },
    { source: "نهج‌البلاغه", narratorChain: "امام علی علیه‌السلام", textAr: "من أصلح ما بینه و بین الله أصلح الله ما بینه و بین الناس", subjectTags: JSON.stringify(["اصلاح"]) },
    { source: "کافی", narratorChain: "امام صادق علیه‌السلام", textAr: "إذا أحب الله عبداً نظر إلیه، فإذا نظر إلیه ألقی فی قلبه حبَّ ثلاثٍ: حبَّ الصلاة وحبَّ الصدقة وحبَّ الصیام", subjectTags: JSON.stringify(["محبت خدا"]) },
    { source: "بحارالانوار", narratorChain: "پیامبر اکرم صلی‌الله علیه وآله", textAr: "أحب الأعمال إلی الله أدومها وإن قلَّ", subjectTags: JSON.stringify(["استمرار"]) },
    { source: "نهج‌البلاغه", narratorChain: "امام علی علیه‌السلام", textAr: "الناس أعداء ما جهلوا", subjectTags: JSON.stringify(["شناخت"]) },
    { source: "کافی", narratorChain: "امام صادق علیه‌السلام", textAr: "من سرَّه أن تکون تجارته رابحة فلیتق الله", subjectTags: JSON.stringify(["تقوا"]) },
    { source: "وسائل الشیعة", narratorChain: "امام صادق علیه‌السلام", textAr: "صلة الرحم تزکی الأعمال و تنمی الأموال و تدفع البلوى", subjectTags: JSON.stringify(["صله رحم"]) },
    { source: "نهج‌البلاغه", narratorChain: "امام علی علیه‌السلام", textAr: "من ذکر الله أحبَّه الله", subjectTags: JSON.stringify(["ذکر"]) },
    { source: "بحارالانوار", narratorChain: "پیامبر اکرم صلی‌الله علیه وآله", textAr: "المسلم من سلم المسلمون من لسانه ویده", subjectTags: JSON.stringify(["مسلمان"]) },
    { source: "کافی", narratorChain: "امام باقر علیه‌السلام", textAr: "تمام الاخلاص أن تکون سریرته کعلانیته", subjectTags: JSON.stringify(["اخلاص"]) },
    { source: "نهج‌البلاغه", narratorChain: "امام علی علیه‌السلام", textAr: "إنّ هذه القلوب تمَلّ کما تَمَلّ الأبدان فابتغوا لها طرائف الحکم", subjectTags: JSON.stringify(["یادگیری"]) },
  ];
  for (const h of hadithsV23) await db.hadith.create({ data: { ...h, grade: null, volume: null, chapter: null, textFa: null } });
  console.log(`  ✓ ${hadithsV23.length} روایت (مجموعه v23)`);

  // روایات نمونه
  const hadiths = [
    { source: "الکافی", volume: 1, grade: "صحیح", textAr: "العلم خير من المال", textFa: "علم بهتر از مال است", subjectTags: JSON.stringify(["علم"]) },
    { source: "الکافی", volume: 2, grade: "صحیح", textAr: "إنما الأعمال بالنيات", textFa: "اعمال به نیّات بستگی دارند", subjectTags: JSON.stringify(["نیّت"]) },
    { source: "من لا یحضره الفقیه", volume: 1, grade: "صحیح", textAr: "طلب العلم فريضة على كل مسلم", textFa: "طلب علم بر هر مسلمانی فرض است", subjectTags: JSON.stringify(["علم", "فرض"]) },
  ];
  for (const h of hadiths) await db.hadith.create({ data: h });
  console.log(`  ✓ ${hadiths.length} روایت نمونه`);

  // کاربران نمونه (همان حساب‌های پیش‌فرض v23)
  const firstBranch = await db.branch.findFirst();
  const demoUsers = [
    { name: "مدیر سامانه", phone: "09120000001", code: "567890", nationalId: "1234567890", role: "ADMIN" as const },
    { name: "مربی نمونه", phone: "09120000002", code: "112233", nationalId: "9876543210", role: "INSTRUCTOR" as const },
    { name: "ارزیاب نمونه", phone: "09120000003", code: "445566", nationalId: "5555555555", role: "EVALUATOR" as const },
  ];
  for (const u of demoUsers) {
    await db.user.create({
      data: {
        name: u.name, phone: u.phone, nationalId: u.nationalId,
        passwordHash: await bcrypt.hash(u.code, 10),
        role: u.role, requestedRole: u.role,
        approvalStatus: "APPROVED", active: true,
        branchId: firstBranch?.id ?? null,
      },
    });
    console.log(`  ✓ کاربر: ${u.name} (${u.phone} / ${u.code})`);
  }

  console.log("\n✅ داده‌های اولیه ایجاد شد");
}

main().catch(e => { console.error("❌ خطا:", e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
