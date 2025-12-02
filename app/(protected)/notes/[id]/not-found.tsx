import Link from "next/link"

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="border border-border p-6 space-y-4">
        <div className="font-mono text-2xl text-white">note not found</div>
        <div className="text-muted-foreground text-sm font-mono">
          <span>&gt;</span> the requested note does not exist or you don't have access to it.
        </div>
        <Link
          href="/notes/list"
          className="inline-block border border-border px-4 py-2 font-mono text-sm text-white hover:bg-muted transition-colors"
        >
          <span>&gt;</span> back to notes
        </Link>
      </div>
    </div>
  )
}

