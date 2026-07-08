export default function Loading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        {/* Ring spinner: brand-primary arc rotating over a quiet border track */}
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-border" />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-primary animate-spin motion-reduce:animate-[spin_2.5s_linear_infinite]"
            style={{ animationDuration: "0.9s" }}
          />
          {/* Accent pulse at center — the one spot of color-play */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
          </div>
        </div>

        <p className="text-sm font-medium tracking-wide text-muted-foreground">
          Loading…
        </p>
      </div>
    </div>
  );
}
