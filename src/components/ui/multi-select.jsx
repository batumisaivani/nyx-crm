import { useState, useRef, useEffect } from 'react'
import * as Popover from '@radix-ui/react-popover'
import * as Checkbox from '@radix-ui/react-checkbox'
import { ChevronDown, Check, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select...',
  className,
  maxDisplay = 2,
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)

  const handleToggle = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onChange?.(newValue)
  }

  const handleClearAll = (e) => {
    e.stopPropagation()
    onChange?.([])
  }

  const selectedOptions = options.filter((opt) => value.includes(opt.value))
  const displayText =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length <= maxDisplay
      ? selectedOptions.map((opt) => opt.label).join(', ')
      : `${selectedOptions.length} selected`

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          ref={triggerRef}
          className={cn(
            'flex h-8.5 w-full items-center justify-between gap-2 rounded-md border border-purple-700/50 bg-purple-950/25 px-3 py-1 text-sm text-white shadow-sm transition-all',
            'hover:bg-purple-950/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        >
          <span className={cn('truncate', value.length === 0 && 'text-gray-400')}>
            {displayText}
          </span>
          <div className="flex items-center gap-1">
            {value.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-purple-700/50 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <ChevronDown className={cn('h-4 w-4 opacity-60 transition-transform', open && 'rotate-180')} />
          </div>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 w-[var(--radix-popover-trigger-width)] rounded-md border border-purple-700 bg-purple-950/95 backdrop-blur-xl p-1.5 shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
          )}
        >
          <div className="max-h-64 overflow-y-auto">
            {options.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">No options available</div>
            ) : (
              options.map((option) => {
                const isSelected = value.includes(option.value)
                return (
                  <label
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white transition-colors',
                      'hover:bg-purple-800/50 focus:bg-purple-800/50',
                      isSelected && 'bg-purple-800/30'
                    )}
                  >
                    <Checkbox.Root
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(option.value)}
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-purple-600',
                        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-0',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        isSelected ? 'bg-purple-600 border-purple-600' : 'bg-purple-950/50'
                      )}
                    >
                      <Checkbox.Indicator className="flex items-center justify-center text-white">
                        <Check className="h-3 w-3" />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <span className="flex-1">{option.label}</span>
                  </label>
                )
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
