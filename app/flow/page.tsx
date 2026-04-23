import type { ReactElement } from "react";
import Link from "next/link";
import {
  ArrowRight, Sparkles, PenLine, Palette, Search,
  Megaphone, CheckCircle2, RotateCcw, ArrowDown, CircleCheck, Send,
} from "lucide-react";
import { ModeToggle } from "@/app/components/mode-toggle";

// ─── Telegram badge ───────────────────────────────────────────────────────────

const TelegramIcon = () => (
  <svg className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
  </svg>
);

function TelegramBadge({ message, auto }: { message: string; auto: boolean }) {
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 ${
      auto
        ? "border-sky-400/30 bg-sky-500/5 dark:border-sky-500/30"
        : "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/50"
    }`}>
      <span className={auto ? "text-sky-500 dark:text-sky-400" : "text-purple-600 dark:text-purple-400"}>
        <TelegramIcon />
      </span>
      <div>
        <p className={`text-xs font-bold mb-0.5 ${auto ? "text-sky-600 dark:text-sky-400" : "text-purple-700 dark:text-purple-300"}`}>
          إشعار Telegram — {auto ? "تلقائي ⚡" : "اختياري ☑️"}
        </p>
        <p className={`text-xs leading-relaxed ${auto ? "text-sky-600/80 dark:text-sky-400/80" : "text-purple-600 dark:text-purple-400"}`}>
          {message}
        </p>
        {!auto && (
          <p className="text-[11px] mt-1 text-purple-500/70 dark:text-purple-500 italic">
            يظهر checkbox للمستخدم قبل الحفظ — لا يُرسل عند التعديل
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Stage color themes — explicit per-variant so Tailwind scanner sees them ──

type StageTheme = {
  iconBg:       string; // solid bg for icon circle
  headerBg:     string; // card header tinted bg
  headerBorder: string; // card border + header border
  labelText:    string; // role label + step number text
  stepBg:       string; // step number circle bg
  stepBorder:   string; // step number circle border
  transitionBg: string; // transition row bg
};

const THEMES: Record<number, StageTheme> = {
  1: {
    iconBg:       "bg-violet-500",
    headerBg:     "bg-violet-50 dark:bg-violet-950/60",
    headerBorder: "border-violet-200 dark:border-violet-800",
    labelText:    "text-violet-900 dark:text-violet-200",
    stepBg:       "bg-violet-50 dark:bg-violet-950/60",
    stepBorder:   "border-violet-200 dark:border-violet-800",
    transitionBg: "bg-violet-50 dark:bg-violet-950/60",
  },
  2: {
    iconBg:       "bg-orange-500",
    headerBg:     "bg-orange-50 dark:bg-orange-950/60",
    headerBorder: "border-orange-200 dark:border-orange-800",
    labelText:    "text-orange-900 dark:text-orange-200",
    stepBg:       "bg-orange-50 dark:bg-orange-950/60",
    stepBorder:   "border-orange-200 dark:border-orange-800",
    transitionBg: "bg-orange-50 dark:bg-orange-950/60",
  },
  3: {
    iconBg:       "bg-amber-500",
    headerBg:     "bg-amber-50 dark:bg-amber-950/60",
    headerBorder: "border-amber-200 dark:border-amber-800",
    labelText:    "text-amber-900 dark:text-amber-200",
    stepBg:       "bg-amber-50 dark:bg-amber-950/60",
    stepBorder:   "border-amber-200 dark:border-amber-800",
    transitionBg: "bg-amber-50 dark:bg-amber-950/60",
  },
  4: {
    iconBg:       "bg-blue-500",
    headerBg:     "bg-blue-50 dark:bg-blue-950/60",
    headerBorder: "border-blue-200 dark:border-blue-800",
    labelText:    "text-blue-900 dark:text-blue-200",
    stepBg:       "bg-blue-50 dark:bg-blue-950/60",
    stepBorder:   "border-blue-200 dark:border-blue-800",
    transitionBg: "bg-blue-50 dark:bg-blue-950/60",
  },
};

// ─── Status badge classes — explicit strings for Tailwind scanner ─────────────

const STATUS_CLS = {
  "قيد الإنتاج":    "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  "جاهز للمراجعة": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700",
  "جاهز للنشر":    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700",
  "تم النشر":      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-700",
} as const;

// ─── Data ─────────────────────────────────────────────────────────────────────

const STAGES = [
  {
    id: 1,
    role: "كاتب المحتوى",
    roleEn: "Content Writer",
    icon: PenLine,
    statusLabel: "قيد الإنتاج" as keyof typeof STATUS_CLS,
    title: "إنشاء المنشور",
    description: "يبدأ سير العمل بإنشاء منشور جديد. كاتب المحتوى يملأ كل التفاصيل اللازمة للتصميم والإنتاج.",
    fields: [
      { label: "الفكرة",               sub: "الفكرة الرئيسية للمنشور" },
      { label: "نوع المحتوى",          sub: "فيديو، كاروسيل، بوست، ستوري، ريل" },
      { label: "القنوات",               sub: "المنصات المستهدفة" },
      { label: "مرحلة العميل",          sub: "توعية، تفاعل، عملاء، تحويل" },
      { label: "النص الكامل",           sub: null },
      { label: "الخطاف Hook",           sub: null },
      { label: "الدعوة للتصرف CTA",     sub: null },
      { label: "نبرة الصوت Voice Tone",  sub: null },
      { label: "الإلهام Reference",     sub: null },
      { label: "السيناريو Script",       sub: "رابط خارجي إن وجد" },
      { label: "ملحوظات للمصمم Notes",  sub: null },
    ],
    telegram: "📋 منشور جديد — الفكرة، نوع المحتوى، القنوات، اليوم، واسم العميل. يُرسل للفريق عند إنشاء منشور جديد فقط، وليس عند التعديل.",
    telegramAuto: false,
    transition: "حفظ المنشور → الحالة تصبح «قيد الإنتاج»",
    hasFeedback: false,
  },
  {
    id: 2,
    role: "المصمم / المصوّر",
    roleEn: "Designer",
    icon: Palette,
    statusLabel: "جاهز للمراجعة" as keyof typeof STATUS_CLS,
    title: "الإنتاج",
    description: "المصمم يدخل صفحة الإنتاج ويشوف كل بيانات المنشور كاملة. يصمم أو يصوّر الإبداع، ثم يرفع الرابط.",
    steps: [
      "يقرأ البريف كامل (النص، الخطاف، CTA، نبرة الصوت، الإلهام، السيناريو)",
      "يصمم / يصوّر / يُنتج الإبداع",
      "يرفع رابط الإبداع (Google Drive أو غيره)",
      "يضغط «جاهز للمراجعة»",
    ],
    telegram: "🎨 إبداع جاهز للمراجعة — رابط الإبداع، الفكرة، واليوم. يُرسل لكاتب المحتوى فور الضغط على «جاهز للمراجعة».",
    telegramAuto: true,
    transition: "رفع الرابط + الضغط على «جاهز للمراجعة»",
    hasFeedback: true,
    feedbackNote: "إذا طُلب تعديل، يرفع نسخة جديدة ويحدّث الرابط بدون تغيير الحالة.",
  },
  {
    id: 3,
    role: "كاتب المحتوى",
    roleEn: "Content Writer",
    icon: Search,
    statusLabel: "جاهز للنشر" as keyof typeof STATUS_CLS,
    title: "منح الموافقة",
    description: "كاتب المحتوى يراجع الإبداع عبر الرابط ويتأكد إنه مطابق للبريف. إما يوافق أو يطلب تعديل.",
    steps: [
      "يفتح رابط الإبداع ويراجعه",
      "يتحقق من مطابقة النص، الفكرة، والأسلوب",
      "إذا موافق → يضغط «جاهز للنشر»",
      "إذا محتاج تعديل → يتواصل مع المصمم ويطلب تحديث الرابط",
    ],
    telegram: "✅ منشور جاهز للنشر — الفكرة، القنوات، ورابط الإبداع. يُرسل للميديا باير فور الضغط على «جاهز للنشر».",
    telegramAuto: true,
    transition: "الموافقة على الإبداع + الضغط على «جاهز للنشر»",
    hasFeedback: true,
    feedbackNote: "إذا احتاج تعديل، يتواصل مع المصمم ويطلب منه تحديث الرابط قبل الموافقة.",
  },
  {
    id: 4,
    role: "الميديا باير",
    roleEn: "Media Buyer",
    icon: Megaphone,
    statusLabel: "تم النشر" as keyof typeof STATUS_CLS,
    title: "النشر",
    description: "الميديا باير يدخل صفحة النشر، يضيف تفاصيل الإعلان والميزانية، وينشر المحتوى على المنصات.",
    steps: [
      "يفتح رابط الإبداع النهائي ويراجعه",
      "يحدد: عضوي أم مدفوع",
      "إذا مدفوع: يضيف الميزانية، العملة، ومدة الإعلان",
      "يحدد موعد النشر (تاريخ + وقت)",
      "يضيف روابط النشر لكل قناة بعد النشر",
      "يضغط «تم النشر»",
    ],
    telegram: "🚀 تم النشر — الفكرة، القنوات، الميزانية (إن وجدت)، وروابط المنشورات. يُرسل للفريق كله تلقائياً فور الضغط على «تم النشر».",
    telegramAuto: true,
    transition: "الضغط على «تم النشر»",
    hasFeedback: false,
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FlowPage(): ReactElement {
  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">

      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="flex items-center justify-between px-5 h-14 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="h-5 w-px bg-border shrink-0" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <h1 className="text-sm font-semibold text-foreground">دليل سير العمل</h1>
              <span className="text-[11px] text-muted-foreground hidden sm:block">— من المنشور إلى النشر</span>
            </div>
          </div>

          {/* Legend + toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1.5">
              {(Object.entries(STATUS_CLS) as [string, string][]).map(([label, cls]) => (
                <span key={label} className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${cls}`}>
                  {label}
                </span>
              ))}
            </div>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">

        {/* Flow */}
        <div className="relative">
          <div className="absolute right-6.75 top-0 bottom-0 w-px bg-border" aria-hidden />

          <div className="space-y-0">
            {STAGES.map((stage, i) => {
              const Icon = stage.icon;
              const theme = THEMES[stage.id];
              const statusCls = STATUS_CLS[stage.statusLabel];

              return (
                <div key={stage.id}>
                  <div className="relative flex gap-6">

                    {/* Step indicator */}
                    <div className="relative z-10 flex flex-col items-center shrink-0 w-14">
                      <div className={`h-14 w-14 rounded-2xl ${theme.iconBg} text-white flex items-center justify-center shadow-md ring-4 ring-background`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="mt-2 text-[10px] font-bold text-muted-foreground/40 tabular-nums">{stage.id}</span>
                    </div>

                    {/* Card */}
                    <div className={`flex-1 mb-2 rounded-2xl border ${theme.headerBorder} bg-card shadow-sm overflow-hidden`}>

                      {/* Card header */}
                      <div className={`${theme.headerBg} px-5 py-4 border-b ${theme.headerBorder} flex items-center justify-between flex-wrap gap-3`}>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className={`text-xs font-bold uppercase tracking-widest ${theme.labelText} opacity-70`}>المرحلة {stage.id}</span>
                            <span className="text-muted-foreground/50">·</span>
                            <span className={`text-xs font-semibold ${theme.labelText}`}>{stage.role}</span>
                            <span className={`text-[10px] font-mono ${theme.labelText} opacity-50`}>{stage.roleEn}</span>
                          </div>
                          <h3 className="text-base font-bold text-foreground">{stage.title}</h3>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusCls} shrink-0`}>
                          {stage.statusLabel}
                        </span>
                      </div>

                      {/* Card body */}
                      <div className="px-5 py-5 space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{stage.description}</p>

                        {/* Fields (stage 1) */}
                        {"fields" in stage && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">الحقول المطلوبة</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {stage.fields.map((f) => (
                                <div key={f.label} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                                  <CircleCheck className="h-3 w-3 text-violet-400 dark:text-violet-500 shrink-0" />
                                  <span className="text-sm font-medium text-foreground">{f.label}</span>
                                  {f.sub && <span className="text-[11px] text-muted-foreground/50 mr-0.5 truncate">{f.sub}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Steps */}
                        {"steps" in stage && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">الخطوات</p>
                            <ol className="space-y-2">
                              {stage.steps.map((step, si) => (
                                <li key={si} className="flex items-start gap-3">
                                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${theme.stepBg} ${theme.labelText} text-[10px] font-bold border ${theme.stepBorder} mt-0.5`}>
                                    {si + 1}
                                  </span>
                                  <span className="text-sm text-foreground leading-relaxed">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Telegram */}
                        <TelegramBadge message={stage.telegram} auto={stage.telegramAuto} />

                        {/* Feedback loop */}
                        {"hasFeedback" in stage && stage.hasFeedback && (
                          <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-950/40 px-4 py-3">
                            <RotateCcw className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{stage.feedbackNote}</p>
                          </div>
                        )}

                        {/* Transition */}
                        <div className={`flex items-center gap-2 rounded-xl ${theme.transitionBg} border ${theme.headerBorder} px-4 py-2.5`}>
                          <Send className={`h-3.5 w-3.5 ${theme.labelText} shrink-0`} />
                          <span className={`text-xs font-semibold ${theme.labelText}`}>الانتقال للمرحلة التالية:</span>
                          <span className="text-xs text-foreground">{stage.transition}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  {i < STAGES.length - 1 && (
                    <div className="flex mr-7 py-1">
                      <ArrowDown className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Final */}
        <div className="mt-4 mr-20 rounded-2xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50 px-6 py-6 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 mb-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-lg font-bold text-green-700 dark:text-green-300">تم النشر 🎉</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">المنشور اكتمل — المحتوى على الهواء والحالة محدّثة في النظام.</p>
        </div>

      </main>
    </div>
  );
}
