import type { LucideIcon } from "lucide-react";

interface PageTitleProps {
  icon: LucideIcon;
  title: string;
}

export default function PageTitle({ icon: Icon, title }: PageTitleProps) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-text-main">
      <Icon className="h-4 w-4 text-text-main" />
      <p className="text-xs uppercase tracking-[3px] text-text-muted text-shadow-2xs">
        {title}
      </p>
    </div>
  );
}
