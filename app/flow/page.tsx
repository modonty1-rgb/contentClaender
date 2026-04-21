import type { ReactElement } from "react";
import Link from "next/link";
import {
  ArrowRight, Sparkles, PenLine, Palette, Search,
  Megaphone, CheckCircle2, RotateCcw, ArrowDown, CircleCheck, Send,
} from "lucide-react";

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
        ? "border-[#229ED9]/20 bg-[#229ED9]/5 text-[#229ED9]"
        : "border-purple-200 bg-purple-50 text-purple-700"
    }`}>
      <span className={auto ? "text-[#229ED9]" : "text-purple-600"}><TelegramIcon /></span>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`text-xs font-bold ${auto ? "text-[#229ED9]" : "text-purple-700"}`}>
            إشعار Telegram — {auto ? "تلقائي ⚡" : "اختياري ☑️"}
          </p>
        </div>
        <p className={`text-xs leading-relaxed ${auto ? "text-[#229ED9]/80" : "text-purple-600"}`}>{message}</p>
        {!auto && (
          <p className="text-[11px] mt-1 text-purple-500/70 italic">يظهر checkbox للمستخدم قبل الحفظ — لا يُرسل عند التعديل</p>
        )}
      </div>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const STAGES = [
  {
    id: 1,
    role: "كاتب المحتوى",
    roleEn: "Content Writer",
    icon: PenLine,
    color: { bg: "bg-violet-500", light: "bg-violet-50", border: "border-violet-200", text: "text-violet-700" },
    title: "إنشاء المنشور",
    status: { label: "قيد الإنتاج", className: "bg-zinc-100 text-zinc-600 border border-zinc-200" },
    description: "يبدأ الفلو بإنشاء منشور جديد. كاتب المحتوى يملأ كل التفاصيل اللازمة للتصميم والإنتاج.",
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
    color: { bg: "bg-orange-500", light: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
    title: "الإنتاج",
    status: { label: "جاهز للمراجعة", className: "bg-amber-50 text-amber-700 border border-amber-200" },
    description: "المصمم يدخل صفحة الإنتاج ويشوف كل بيانات المنشور كاملة. يصمم أو يصوّر الكريتيف، ثم يرفع الرابط.",
    steps: [
      "يقرأ البريف كامل (النص، الخطاف، CTA، نبرة الصوت، الإلهام، السيناريو)",
      "يصمم / يصوّر / يُنتج الكريتيف",
      "يرفع رابط الكريتيف (Google Drive أو غيره)",
      "يضغط «جاهز للمراجعة»",
    ],
    telegram: "🎨 كريتيف جاهز للمراجعة — رابط الكريتيف، الفكرة، واليوم. يُرسل لكاتب المحتوى فور الضغط على «جاهز للمراجعة».",
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
    color: { bg: "bg-amber-500", light: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
    title: "المراجعة والموافقة",
    status: { label: "جاهز للنشر", className: "bg-blue-50 text-blue-700 border border-blue-200" },
    description: "كاتب المحتوى يراجع الكريتيف عبر الرابط ويتأكد إنه مطابق للبريف. إما يوافق أو يطلب تعديل.",
    steps: [
      "يفتح رابط الكريتيف ويراجعه",
      "يتحقق من مطابقة النص، الفكرة، والأسلوب",
      "إذا موافق → يضغط «جاهز للنشر»",
      "إذا محتاج تعديل → يتواصل مع المصمم ويطلب تحديث الرابط",
    ],
    telegram: "✅ منشور جاهز للنشر — الفكرة، القنوات، ورابط الكريتيف. يُرسل للميديا باير فور الضغط على «جاهز للنشر».",
    telegramAuto: true,
    transition: "الموافقة على الكريتيف + الضغط على «جاهز للنشر»",
    hasFeedback: true,
    feedbackNote: "إذا احتاج تعديل، يتواصل مع المصمم ويطلب منه تحديث الرابط قبل الموافقة.",
  },
  {
    id: 4,
    role: "الميديا باير",
    roleEn: "Media Buyer",
    icon: Megaphone,
    color: { bg: "bg-blue-500", light: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
    title: "النشر",
    status: { label: "تم النشر", className: "bg-green-50 text-green-700 border border-green-200" },
    description: "الميديا باير يدخل صفحة النشر، يضيف تفاصيل الإعلان والميزانية، وينشر المحتوى على المنصات.",
    steps: [
      "يفتح رابط الكريتيف النهائي ويراجعه",
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
      <header className="border-b border-border bg-card px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1 transition-colors -mx-2">
            <ArrowRight className="h-4 w-4" />
            الرئيسية
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">دليل سير العمل</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground mb-4 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            من المنشور إلى النشر
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">كيف يسير العمل؟</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            دليل كامل لكيفية سير العمل داخل النظام — من لحظة إنشاء المنشور حتى يُنشر على المنصات.
          </p>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: "قيد الإنتاج",    cls: "bg-zinc-100 text-zinc-600 border border-zinc-200" },
                { label: "جاهز للمراجعة", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
                { label: "جاهز للنشر",    cls: "bg-blue-50 text-blue-700 border border-blue-200" },
                { label: "تم النشر",      cls: "bg-green-50 text-green-700 border border-green-200" },
              ].map((s) => (
                <span key={s.label} className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>
                  {s.label}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[#229ED9]/20 bg-[#229ED9]/5 px-3 py-1">
              <svg className="h-3 w-3 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
              </svg>
              <span className="text-xs font-semibold text-[#229ED9]">Telegram تلقائي ⚡</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1">
              <svg className="h-3 w-3 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
              </svg>
              <span className="text-xs font-semibold text-purple-700">Telegram اختياري ☑️</span>
            </div>
          </div>
        </div>

        {/* Flow */}
        <div className="relative">
          <div className="absolute right-6.75 top-0 bottom-0 w-px bg-border" aria-hidden />

          <div className="space-y-0">
            {STAGES.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <div key={stage.id}>
                  <div className="relative flex gap-6">

                    {/* Step indicator */}
                    <div className="relative z-10 flex flex-col items-center shrink-0 w-14">
                      <div className={`h-14 w-14 rounded-2xl ${stage.color.bg} text-white flex items-center justify-center shadow-md ring-4 ring-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="mt-2 text-[10px] font-bold text-muted-foreground/40 tabular-nums">{stage.id}</span>
                    </div>

                    {/* Card */}
                    <div className={`flex-1 mb-2 rounded-2xl border ${stage.color.border} bg-card shadow-sm overflow-hidden`}>

                      {/* Card header */}
                      <div className={`${stage.color.light} px-5 py-4 border-b ${stage.color.border} flex items-center justify-between flex-wrap gap-3`}>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className={`text-xs font-bold uppercase tracking-widest ${stage.color.text} opacity-60`}>المرحلة {stage.id}</span>
                            <span className="text-muted-foreground/30">·</span>
                            <span className={`text-xs font-semibold ${stage.color.text}`}>{stage.role}</span>
                            <span className="text-[10px] text-muted-foreground/40 font-mono">{stage.roleEn}</span>
                          </div>
                          <h3 className="text-base font-bold text-foreground">{stage.title}</h3>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${stage.status.className} shrink-0`}>
                          {stage.status.label}
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
                                  <CircleCheck className="h-3 w-3 text-violet-400 shrink-0" />
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
                                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${stage.color.light} ${stage.color.text} text-[10px] font-bold border ${stage.color.border} mt-0.5`}>
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
                          <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3">
                            <RotateCcw className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 leading-relaxed">{stage.feedbackNote}</p>
                          </div>
                        )}

                        {/* Transition */}
                        <div className={`flex items-center gap-2 rounded-xl ${stage.color.light} border ${stage.color.border} px-4 py-2.5`}>
                          <Send className={`h-3.5 w-3.5 ${stage.color.text} shrink-0`} />
                          <span className={`text-xs font-semibold ${stage.color.text}`}>الانتقال للمرحلة التالية:</span>
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
        <div className="mt-4 mr-20 rounded-2xl border border-green-200 bg-green-50 px-6 py-6 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 border border-green-200 mb-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-lg font-bold text-green-700">تم النشر 🎉</p>
          <p className="text-sm text-green-600 mt-1">المنشور اكتمل — المحتوى على الهواء والحالة محدّثة في النظام.</p>
        </div>

      </main>
    </div>
  );
}
