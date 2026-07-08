"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error reporting service here
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        {/* Signature mark: a cracked ring — the same ring language as the
            loading spinner, but broken, to visually tie "loading failed"
            back to "loading" */}
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-border" />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-destructive border-r-destructive"
            style={{ transform: "rotate(20deg)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-brand-accent" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred while loading this page. You can try
            again, or head back if the problem continues.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/70">
              Error reference: {error.digest}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-brand-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
