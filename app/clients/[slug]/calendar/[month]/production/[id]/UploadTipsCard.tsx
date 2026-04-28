import { ImageIcon, Video, Lightbulb, Info } from "lucide-react";

export function UploadTipsCard() {
  return (
    <aside className="rounded-2xl border border-border bg-card shadow-sm p-4 space-y-4 lg:sticky lg:top-20">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <Info className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">حدود رفع الإبداع</h3>
      </div>

      {/* Image limit */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
            <ImageIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-foreground">الصور</p>
            <p className="text-[10px] text-muted-foreground">JPG · PNG · GIF · WebP</p>
          </div>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">10MB</span>
        </div>
      </div>

      {/* Video limit */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
            <Video className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-foreground">الفيديو</p>
            <p className="text-[10px] text-muted-foreground">MP4 · MOV · WebM</p>
          </div>
          <span className="text-sm font-bold text-purple-600 dark:text-purple-400 tabular-nums">100MB</span>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <Lightbulb className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">نصائح لتجاوز الحد</p>
        </div>
        <ul className="text-[10px] text-amber-900 dark:text-amber-200 space-y-1 leading-relaxed">
          <li>
            <span className="font-semibold">صور &gt; 10MB:</span> صدّر JPG بجودة 85% — يقل الحجم 60% بدون فرق مرئي
          </li>
          <li>
            <span className="font-semibold">فيديو &gt; 100MB:</span> اضغط بـ HandBrake (H.264, 4-6 Mbps) → ينزل لـ 30-50MB
          </li>
          <li>
            <span className="font-semibold">المحتوى الأمثل للسوشيال:</span> 60-90 ثانية فيديو، صورة 1080×1920
          </li>
        </ul>
      </div>
    </aside>
  );
}
