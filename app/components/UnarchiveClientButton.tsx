"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { unarchiveClient } from "@/app/actions/clients";
import { toast } from "@/app/components/ui/sonner";

export function UnarchiveClientButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await unarchiveClient(clientId);
      if (result.success) {
        toast.success(`تم استرجاع ${clientName}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-7 gap-1 px-2 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
      onClick={handleClick}
      disabled={pending}
    >
      <ArchiveRestore className="h-3 w-3" />
      {pending ? "جاري..." : "استرجاع"}
    </Button>
  );
}
