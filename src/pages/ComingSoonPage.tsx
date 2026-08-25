export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-ink-strong">{title}</h1>
      <p className="mt-1 text-sm text-ink-muted">This page is coming soon.</p>
    </div>
  )
}
