"use client";

import { useEffect } from "react";
// global-error replaces the root layout entirely, so it needs its own
// html/body and must re-import the global stylesheet to keep theme tokens
// and Tailwind utilities available.
import "./globals.css";

export default function GlobalError({
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
    <html lang="en">
      <body className="bg-background">
        <div className="flex min-h-screen w-full items-center justify-center px-6">
          <div className="flex max-w-md flex-col items-center gap-6 text-center">
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
                A critical error occurred and this page couldn&apos;t load.
                Try again, or come back in a bit if the problem continues.
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground/70">
                  Error reference: {error.digest}
                </p>
              )}
            </div>

            <button
              onClick={reset}
              className="rounded-md bg-brand-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
