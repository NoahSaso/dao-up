import cn from "classnames"
import { FC, useState } from "react"
import { IoCaretDownSharp, IoCheckmark } from "react-icons/io5"

import { Button } from "@/components"

interface SelectItem {
  label: string
  onClick: (on: boolean) => void
  selected: boolean
}

interface SelectProps {
  label: string
  noneSelectedSublabel?: string
  items: SelectItem[]
  className?: string
}

export const Select: FC<SelectProps> = ({
  label,
  noneSelectedSublabel,
  items,
  className,
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Button
      className={cn(
        "flex flex-row justify-between items-center relative z-10 rounded-md py-1.5 px-3",
        className
      )}
      onClick={() => setOpen((o) => !o)}
      outline
    >
      <div className="flex flex-col items-start">
        {label}

        {items.some(({ selected }) => selected) ? (
          <p className="text-sm">
            {items.filter(({ selected }) => selected).length} selected
          </p>
        ) : noneSelectedSublabel ? (
          <p className="text-sm">{noneSelectedSublabel}</p>
        ) : undefined}
      </div>
      <IoCaretDownSharp size={18} className="ml-2" />

      <div
        className={cn(
          "absolute top-full left-0 right-0 mt-[2px]",
          "bg-green text-dark rounded-md",
          { hidden: !open }
        )}
      >
        {items.map(({ label: itemLabel, onClick, selected }) => (
          <div
            key={itemLabel}
            className="flex flex-row justify-between items-center w-full h-full py-1.5 px-3 cursor-pointer hover:text-dark/50 border-b border-dark/20 last:border-b-0"
            onClick={() => onClick(!selected)}
          >
            {itemLabel}
            {selected && <IoCheckmark size={18} className="ml-2" />}
          </div>
        ))}
      </div>
    </Button>
  )
}
