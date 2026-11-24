// Templates for reports and lesson plans based on Nehzat documents

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  data: {
    subject: string;
    summary: string;
    reportPattern: string;
    reportStyle: string;
    content: string;
    challenges: string;
    solutions: string;
    pedagogicalNotes: string;
    recommendations: string;
    quranRefs: any[];
    hadithRefs: any[];
  };
}

export interface LessonPlanTemplate {
  id: string;
  name: string;
  description: string;
  data: {
    title: string;
    subject: string;
    grade: string;
    generalObjective: string;
    objectives: string[];
    behavioralObjectives: string;
    subHeadings: string;
    prerequisites: string;
    diagnosticEvaluation: string;
    preparationPhase: string;
    introductionPhase: string;
    presentationPhase: string;
    summaryPhase: string;
    evaluationPhase: string;
    supplementaryActivities: string;
    teachingMethod: string;
    teachingAids: string;
    evaluationQuestions: string;
    quranRefs: any[];
    hadithRefs: any[];
    sources: string[];
  };
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "tpl-report-tafsir",
    name: "گزارش تفسیر قرآن",
    description: "الگوی استاندارد برای جلسات تفسیر آیات قرآن",
    data: {
      subject: "تفسیر آیه ... سوره ...",
      summary: "",
      reportPattern: "CHRONOLOGICAL",
      reportStyle: "ANALYTICAL",
      content: "۱. مقدمه و تلاوت آیه\n۲. بررسی معنای لغوی کلمات کلیدی\n۳. تفسیر آیه بر اساس روایات اهل بیت (ع)\n۴. کاربرد عملی در زندگی\n۵. مشارکت متربیان و سؤالات مطرح‌شده",
      challenges: "",
      solutions: "",
      pedagogicalNotes: "",
      recommendations: "",
      quranRefs: [],
      hadithRefs: [],
    },
  },
  {
    id: "tpl-report-akhlaq",
    name: "گزارش اخلاق اسلامی",
    description: "الگوی استاندارد برای جلسات آموزش اخلاق",
    data: {
      subject: "موضوع اخلاقی: ...",
      summary: "",
      reportPattern: "CHRONOLOGICAL",
      reportStyle: "PRESCRIPTIVE",
      content: "۱. تلاوت آیه مرتبط\n۲. تعریف موضوع اخلاقی\n۳. بررسی از منظر قرآن و روایات\n۴. مثال‌های عملی از زندگی معصومین (ع)\n۵. کاربرد در زندگی روزمره متربیان",
      challenges: "",
      solutions: "",
      pedagogicalNotes: "",
      recommendations: "",
      quranRefs: [],
      hadithRefs: [],
    },
  },
  {
    id: "tpl-report-feqh",
    name: "گزارش فقه و احکام",
    description: "الگوی استاندارد برای جلسات آموزش احکام",
    data: {
      subject: "حکم فقهی: ...",
      summary: "",
      reportPattern: "DEDUCTIVE",
      reportStyle: "ANALYTICAL",
      content: "۱. طرح مسئله\n۲. ادله شرعی (قرآن، سنت، عقل، اجماع)\n۳. فتوای مرجع تقلید\n۴. موانع و شبهات\n۵. کاربرد عملی",
      challenges: "",
      solutions: "",
      pedagogicalNotes: "",
      recommendations: "",
      quranRefs: [],
      hadithRefs: [],
    },
  },
];

export const LESSON_PLAN_TEMPLATES: LessonPlanTemplate[] = [
  {
    id: "tpl-lp-tafsir",
    name: "طرح درس تفسیر قرآن",
    description: "الگوی کامل برای تدریس تفسیر آیات قرآن",
    data: {
      title: "طرح درس: تفسیر آیه ...",
      subject: "تفسیر قرآن",
      grade: "بزرگسالان - سطح متوسط",
      generalObjective: "متربیان با معنای آیه و کاربرد آن در زندگی آشنا شوند",
      objectives: [
        "آشنایی با معنای لغوی آیه",
        "درک تفسیر آیه بر اساس روایات",
        "تبیین کاربرد عملی آیه",
      ],
      behavioralObjectives: "۱- معنای آیه را در چند جمله بیان کنند (شناختی-دانش)\n۲- تفسیر آیه را بر اساس روایات توضیح دهند (شناختی-درک)\n۳- دو کاربرد عملی آیه در زندگی بنویسند (شناختی-کاربرد)",
      subHeadings: "۱- معنای لغوی\n۲- تفسیر روایی\n۳- کاربرد عملی",
      prerequisites: "متربیان باید با سوره مربوطه و معنای کلی آن آشنا باشند",
      diagnosticEvaluation: "۱- سوره ... در چند بخش است؟\n۲- آیه ... را از حفظ بخوانید",
      preparationPhase: "مربی: تلاوت آیه، آماده‌سازی متن تفسیر\nمتربی: مرور آیه قبل",
      introductionPhase: "تلاوت آیه و طرح سؤال درباره معنای کلی",
      presentationPhase: "۱- بررسی لغوی (۱۵ دقیقه)\n۲- تفسیر روایی با ارجاع به کتب (۲۰ دقیقه)\n۳- بحث و پرسش و پاسخ (۱۵ دقیقه)",
      summaryPhase: "جمع‌بندی توسط متربیان - هر یک نکته کلیدی را بیان کند",
      evaluationPhase: "شفاهی: پرسش از دو نفر درباره کاربرد آیه",
      supplementaryActivities: "مطالعه تفسیر المیزان بخش مربوطه",
      teachingMethod: "توضیحی تعاملی با پرسش و پاسخ",
      teachingAids: "قرآن، کتاب تفسیر، تخته و گچ",
      evaluationQuestions: "۱- معنای آیه را توضیح دهید\n۲- دو کاربرد عملی ذکر کنید",
      quranRefs: [],
      hadithRefs: [],
      sources: ["المیزان", "الکافی", "مجمع‌البیان"],
    },
  },
  {
    id: "tpl-lp-akhlaq",
    name: "طرح درس اخلاق اسلامی",
    description: "الگوی کامل برای تدریس مباحث اخلاقی",
    data: {
      title: "طرح درس: موضوع اخلاقی ...",
      subject: "اخلاق اسلامی",
      grade: "نوجوانان - سطح متوسط",
      generalObjective: "متربیان با فضیلت اخلاقی موردنظر و روش تزکیه نفس آشنا شوند",
      objectives: [
        "شناخت فضیلت اخلاقی از منظر قرآن",
        "آشنایی با سیره معصومین در این فضیلت",
        "یادگیری روش عملی برای تزکیه نفس",
      ],
      behavioralObjectives: "۱- فضیلت اخلاقی را تعریف کنند (شناختی-دانش)\n۲- دو مثال از سیره معصومین بیان کنند (شناختی-درک)\n۳- یک برنامه عملی برای خود بنویسند (شناختی-کاربرد)",
      subHeadings: "۱- تعریف فضیلت\n۲- آیات و روایات\n۳- سیره معصومین\n۴- کاربرد عملی",
      prerequisites: "آشنایی کلی با مفاهیم اخلاقی اسلامی",
      diagnosticEvaluation: "۱- سه فضیلت اخلاقی نام ببرید\n۲- چرا اخلاق مهم است؟",
      preparationPhase: "مربی: آماده‌سازی داستان و آیات\nمتربی: مرور درس قبل",
      introductionPhase: "طرح داستان کوتاه برای جلب توجه",
      presentationPhase: "۱- تعریف فضیلت (۱۰ دقیقه)\n۲- آیات و روایات (۱۵ دقیقه)\n۳- داستان از سیره (۱۰ دقیقه)\n۴- بحث گروهی (۱۵ دقیقه)",
      summaryPhase: "هر متربی یک نکته کلیدی بیان کند",
      evaluationPhase: "کتبی: یک بند درباره کاربرد در زندگی خود",
      supplementaryActivities: "اجرای برنامه عملی نوشته‌شده و گزارش در جلسه بعد",
      teachingMethod: "داستان‌محور با بحث گروهی",
      teachingAids: "قرآن، کتاب اخلاق، داستان چاپ‌شده",
      evaluationQuestions: "۱- فضیلت را تعریف کنید\n۲- دو مثال از سیره ذکر کنید\n۳- برنامه عملی خود را بنویسید",
      quranRefs: [],
      hadithRefs: [],
      sources: ["الکافی", "نهج‌البلاغه", "محجة‌البیضاء"],
    },
  },
  {
    id: "tpl-lp-aqaid",
    name: "طرح درس عقاید",
    description: "الگوی کامل برای تدریس مباحث اعتقادی",
    data: {
      title: "طرح درس: مسئله اعتقادی ...",
      subject: "عقاید اسلامی",
      grade: "بزرگسالان - سطح پیشرفته",
      generalObjective: "متربیان با دلیل عقلی و نقلی مسئله اعتقادی آشنا شوند",
      objectives: [
        "شناخت مسئله اعتقادی",
        "بررسی ادله عقلی",
        "بررسی ادله نقلی (قرآن و روایات)",
      ],
      behavioralObjectives: "۱- مسئله را تعریف کنند (شناختی-دانش)\n۲- دو دلیل عقلی بیان کنند (شناختی-تحلیل)\n۳- به یک شبهه پاسخ دهند (شناختی-ارزیابی)",
      subHeadings: "۱- تعریف مسئله\n۲- ادله عقلی\n۳- ادله نقلی\n۴- پاسخ به شبهات",
      prerequisites: "آشنایی با اصول عقاید شیعه",
      diagnosticEvaluation: "۱- اصول دین را نام ببرید\n۲- تفاوت ایمان و اسلام چیست؟",
      preparationPhase: "مربی: آماده‌سازی ادله و شبهات\nمتربی: مرور اصول عقاید",
      introductionPhase: "طرح سؤال محوری برای ایجاد تفکر",
      presentationPhase: "۱- تعریف مسئله (۱۰ دقیقه)\n۲- ادله عقلی (۲۰ دقیقه)\n۳- ادله نقلی (۱۵ دقیقه)\n۴- پاسخ به شبهات (۱۵ دقیقه)",
      summaryPhase: "جمع‌بندی توسط متربیان",
      evaluationPhase: "کتبی: پاسخ به یک شبهه در یک بند",
      supplementaryActivities: "مطالعه کتاب عقاید مربوطه",
      teachingMethod: "بحث‌محور با پرسش و پاسخ",
      teachingAids: "قرآن، کتاب عقاید، تخته",
      evaluationQuestions: "۱- مسئله را تعریف کنید\n۲- دو دلیل ذکر کنید\n۳- به یک شبهه پاسخ دهید",
      quranRefs: [],
      hadithRefs: [],
      sources: ["الکافی", "نهج‌البلاغه", "الاعتقادات"],
    },
  },
];
