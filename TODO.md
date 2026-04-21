# TODO — Content Calendar

---

## 🟡 شغال الآن

لا يوجد مهام نشطة حالياً.

---

## 🔵 مستقبل

### Telegram Bot
- [ ] إشعار للمصمم/الإديتور عند إنشاء تاسك جديد
- [ ] إشعار لكاتب المحتوى عند "جاهز للمراجعة"
- [ ] إشعار للميديا باير عند "جاهز للنشر"

### Analytics
- [ ] dashboard متوسط وقت الإنتاج
- [ ] dashboard متوسط وقت النشر
- [ ] تقارير per-channel
- [ ] تقارير per-client

---

## ✅ مكتمل

- [x] تصميم الـ Workflow الكامل (4 مراحل)
- [x] بناء السكيما الجديدة + `prisma db push`
- [x] تحديث Backend — `entries.ts` (types, Zod, actions: create/update/updateStatus/get)
- [x] تحديث `lib/constants.ts` — STATUS_OPTIONS, CUSTOMER_STAGE_OPTIONS, CURRENCY_OPTIONS, Snapchat
- [x] Form كاتب المحتوى — حقول hook, cta, text, voiceTone, inspiration, customerStage, contentType
- [x] صفحة الإنتاج `/production/[id]` — assetLink + زر "جاهز للمراجعة"
- [x] صفحة النشر `/publish/[id]` — orgPaid, budget, scheduledDate, channelLinks + زر "نشر"
- [x] CalendarTable — status badges, filters, ActionsMenu بالـ 4 مراحل
- [x] إصلاح Telegram checkbox — يظهر في create mode فقط
- [x] Telegram notifications في كل مرحلة (إنتاج / مراجعة / موافقة / نشر)
- [x] زر "مراجعة والموافقة" في الـ dropdown عند "جاهز للمراجعة"
- [x] تعطيل "صفحة النشر" حتى الوصول لـ "جاهز للنشر"
- [x] إصلاح navigation بعد actions — استبدال `useTransition` بـ `useState`
- [x] إصلاح رقم اليوم للمنشور الثاني على نفس اليوم
- [x] زر "المنشورات فقط" لإخفاء الأيام الفاضية
- [x] Badges للحالات في الـ Header — pills ملونة (zinc/amber/blue/green) تظهر فقط عند count > 0
