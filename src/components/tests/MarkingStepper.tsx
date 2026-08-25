import { ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type MarkingStepperProps = {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  className?: string
}

export function MarkingStepper({
  id,
  label,
  value,
  onChange,
  className,
}: MarkingStepperProps) {
  const display =
    value > 0 ? `+${value}` : value === 0 ? '+0' : String(value)

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-ink-muted">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          value={display}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9+-]/g, '')
            const n = Number(raw)
            if (!Number.isNaN(n)) onChange(n)
          }}
          className="h-11 border-line bg-surface pr-8"
        />
        <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 flex-col">
          <button
            type="button"
            className="rounded p-0.5 text-ink-subtle hover:text-ink-body"
            onClick={() => onChange(value + 1)}
            aria-label={`Increase ${label}`}
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            className="rounded p-0.5 text-ink-subtle hover:text-ink-body"
            onClick={() => onChange(value - 1)}
            aria-label={`Decrease ${label}`}
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
