import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type Option = { id: string; name: string }

type MultiSelectProps = {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Choose from Drop-down',
  disabled,
  className,
}: MultiSelectProps) {
  const selected = options.filter((o) => value.includes(o.id))
  const label =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.map((s) => s.name).join(', ')
        : `${selected.length} selected`

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id))
    else onChange([...value, id])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-11 w-full justify-between border-line bg-surface px-3 font-normal',
            selected.length === 0 && 'text-ink-subtle',
            className,
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="size-4 shrink-0 text-ink-subtle" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-1">
        {options.length === 0 ? (
          <p className="px-2 py-3 text-sm text-ink-subtle">No options available</p>
        ) : (
          <ul className="max-h-56 overflow-y-auto">
            {options.map((opt) => {
              const checked = value.includes(opt.id)
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-bg-muted"
                    onClick={() => toggle(opt.id)}
                  >
                    <Checkbox
                      checked={checked}
                      tabIndex={-1}
                      className="pointer-events-none"
                    />
                    <span className="truncate text-ink-body">{opt.name}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
