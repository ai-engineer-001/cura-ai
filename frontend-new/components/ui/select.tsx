"use client"

import * as React from "react"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
}

export function Select({ value, onValueChange, disabled, children }: SelectProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            value,
            onValueChange,
            disabled,
            open,
            setOpen,
          })
        }
        return child
      })}
    </div>
  )
}

export function SelectTrigger({
  children,
  className = "",
  value,
  disabled,
  open,
  setOpen,
}: {
  children: React.ReactNode
  className?: string
  value?: string
  disabled?: boolean
  open?: boolean
  setOpen?: (open: boolean) => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setOpen?.(!open)}
      className={`
        flex h-10 w-full items-center justify-between rounded-md border
        border-input bg-background px-3 py-2 text-sm ring-offset-background
        placeholder:text-muted-foreground focus:outline-none focus:ring-2
        focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed
        disabled:opacity-50 ${className}
      `}
    >
      {children}
    </button>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span>{placeholder}</span>
}

export function SelectContent({
  children,
  open,
  setOpen,
  onValueChange,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: (open: boolean) => void
  onValueChange?: (value: string) => void
}) {
  if (!open) return null

  return (
    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
      <div className="p-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onValueChange,
              setOpen,
            })
          }
          return child
        })}
      </div>
    </div>
  )
}

export function SelectItem({
  value,
  children,
  onValueChange,
  setOpen,
}: {
  value: string
  children: React.ReactNode
  onValueChange?: (value: string) => void
  setOpen?: (open: boolean) => void
}) {
  return (
    <div
      onClick={() => {
        onValueChange?.(value)
        setOpen?.(false)
      }}
      className="
        relative flex cursor-pointer select-none items-center rounded-sm
        px-2 py-1.5 text-sm outline-none hover:bg-accent
        hover:text-accent-foreground
      "
    >
      {children}
    </div>
  )
}
