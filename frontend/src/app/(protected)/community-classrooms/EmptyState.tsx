import { Search } from "lucide-react";

export default function EmptyState({ topic }: { topic: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-16 text-center sm:py-20">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8168f3]/10 to-[#8168f3]/5">
        <Search className="h-6 w-6 text-[#8168f3]" />
      </div>
      {topic ? (
        <>
          <h3 className="mt-4 text-sm font-semibold text-foreground">
            No community classroom found for &quot;{topic}&quot;
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Use the &quot;Request a classroom&quot; button above to ask for this topic.
          </p>
        </>
      ) : (
        <>
          <h3 className="mt-4 text-sm font-semibold text-foreground">No community classrooms yet</h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Be the first to request one using the button above.
          </p>
        </>
      )}
    </div>
  );
}
