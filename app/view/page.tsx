import { redirect } from "next/navigation";
import { getAllMonthCounts } from "@/app/actions/entries";
import { MONTHS } from "@/lib/constants";

export default async function ViewPage() {
  const counts = await getAllMonthCounts();
  // Redirect to first month that has entries, else first month
  const first = MONTHS.find((m) => (counts[m.value] ?? 0) > 0) ?? MONTHS[0];
  redirect(`/view/${first.value}`);
}
