export const MONTHS = [
  { value: "jan",    label: "يناير",    labelEn: "January"   },
  { value: "feb",    label: "فبراير",   labelEn: "February"  },
  { value: "mar",    label: "مارس",     labelEn: "March"     },
  { value: "apr",    label: "أبريل",    labelEn: "April"     },
  { value: "may",    label: "مايو",     labelEn: "May"       },
  { value: "jun",    label: "يونيو",    labelEn: "June"      },
  { value: "jul",    label: "يوليو",    labelEn: "July"      },
  { value: "aug",    label: "أغسطس",    labelEn: "August"    },
  { value: "sep",    label: "سبتمبر",   labelEn: "September" },
  { value: "oct",    label: "أكتوبر",   labelEn: "October"   },
  { value: "nov",    label: "نوفمبر",   labelEn: "November"  },
  { value: "dec",    label: "ديسمبر",   labelEn: "December"  },
] as const;

export type MonthValue = (typeof MONTHS)[number]["value"];

export const FUNNEL_OPTIONS = ["awareness", "engagement", "leads", "conversion"] as const;
export const TYPE_OPTIONS   = ["vid", "carousel", "post", "story", "reel"] as const;
export const ORG_PAID_OPTIONS = ["organic", "sponsored"] as const;
export const CHANNEL_OPTIONS  = ["instagram", "tiktok", "x", "facebook", "youtube", "linkedin"] as const;
export const PUBLISHING_OPTIONS = [
  "لم يتم النشر",
  "تم النشر",
  "قيد المراجعة",
  "مجدول",
] as const;

export const DAYS_IN_MONTH: Record<MonthValue, number> = {
  jan: 31, feb: 28, mar: 31, apr: 30,
  may: 31, jun: 30, jul: 31, aug: 31,
  sep: 30, oct: 31, nov: 30, dec: 31,
};
