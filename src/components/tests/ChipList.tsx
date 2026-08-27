export default function ChipList({
  items,
}: {
  items: string[] | null | undefined
}) {
  if (!items?.length) {
    return <span className="text-sm text-ink-subtle">—</span>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800"
        >
          {item}
        </span>
      ))}
    </div>
  )
}
