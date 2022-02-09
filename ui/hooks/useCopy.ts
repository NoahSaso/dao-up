import { useRef, useState } from "react"
import { IoCheckmark, IoCopy } from "react-icons/io5"

export const useCopy = (text: string | undefined) => {
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<NodeJS.Timeout | null>(null)
  const copy = () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
    if (!text) return

    navigator.clipboard.writeText(text)

    setCopied(true)
    copiedTimer.current = setTimeout(() => setCopied(false), 5000)
  }

  const Icon = copied ? IoCheckmark : IoCopy

  return { copy, Icon }
}
