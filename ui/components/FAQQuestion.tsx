import cn from "classnames"
import { FC, ReactNode, useState } from "react"
import { GoTriangleDown } from "react-icons/go"

interface FAQQuestionProps {
  question: string
  answer: ReactNode
}

export const FAQQuestion: FC<FAQQuestionProps> = ({ question, answer }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="py-5 border-t border-dark last:border-b">
      <div
        className="flex flex-row justify-between items-center pr-4 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <h2 className="font-medium text-xl pr-10">{question}</h2>
        <GoTriangleDown
          size={20}
          className={cn("transition-all", {
            "rotate-180": open,
          })}
        />
      </div>
      <div
        className={cn(
          "pl-4 pr-12 transition-all overflow-hidden max-h-0 my-0",
          {
            "max-h-max my-2": open,
          }
        )}
      >
        {answer}
      </div>
    </div>
  )
}
