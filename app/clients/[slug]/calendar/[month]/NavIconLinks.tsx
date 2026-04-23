"use client";

import Link from "next/link";
import { Sparkles, Images, Archive } from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/app/components/ui/tooltip";

const iconBtn =
  "h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border bg-card";

type Props = { slug: string };

export function NavIconLinks({ slug }: Props) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={`/clients/${slug}/gallery`} className={iconBtn}>
              <Images className="h-3.5 w-3.5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">معرض الإبداع</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={`/clients/${slug}/archive`} className={iconBtn}>
              <Archive className="h-3.5 w-3.5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">الأرشيف</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/flow" className={iconBtn}>
              <Sparkles className="h-3.5 w-3.5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">سير العمل</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
