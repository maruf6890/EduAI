import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-16 sm:py-20 text-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8168f3]/10">
        <ClipboardList className="h-6 w-6 text-[#8168f3]" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">No assignments yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {onCreate
          ? "Create your first assignment to give students something to work on."
          : "No assignments have been posted yet. Check back later."}
      </p>
      {onCreate && (
        <Button onClick={onCreate} className="mt-5 gap-2 bg-[#8168f3] hover:bg-[#6f57e0] text-white">
          <Plus className="h-4 w-4" />
          Create assignment
        </Button>
      )}
    </div>
  );
}