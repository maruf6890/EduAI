import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        {/* Signature mark: 404 rendered as a "torn" stack, brand-primary base
            with the accent peeking through the gap — the one bold move */}
        <div className="relative">
          <span className="text-8xl font-bold tracking-tight text-brand-primary">
            404
          </span>
          <span className="absolute inset-x-0 -bottom-2 text-8xl font-bold tracking-tight text-brand-accent opacity-20 blur-[1px]">
            404
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground">
            This page doesn&apos;t exist
          </h1>
          <p className="text-sm text-muted-foreground">
            The link may be broken, or the page may have moved. Check the
            address, or head back to a page that does exist.
          </p>
        </div>

        <Link
          href="/"
          className="rounded-md bg-brand-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
