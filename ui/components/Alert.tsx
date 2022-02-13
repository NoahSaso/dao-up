import { FC, PropsWithChildren } from "react"
import { IoClose } from "react-icons/io5"

import { Button } from "."

interface AlertProps {
  title: string
  okLabel: string
  visible: boolean
  hide: () => void
}

export const Alert: FC<PropsWithChildren<AlertProps>> = ({
  children,
  title,
  okLabel,
  visible,
  hide,
}) =>
  visible ? (
    <div
      className="flex justify-center items-center fixed z-50 bg-dark/90 top-0 right-0 bottom-0 left-0 cursor-pointer"
      onClick={({ target, currentTarget }) =>
        target === currentTarget && hide()
      }
    >
      <div className="flex flex-col bg-card rounded-3xl relative p-8 m-8 max-w-xl cursor-auto">
        <Button
          onClick={hide}
          className="absolute top-4 right-4 text-placeholder"
          bare
        >
          <IoClose size={22} />
        </Button>

        <h1 className="text-3xl mb-4 font-medium">{title}</h1>

        {children}

        <Button onClick={hide} className="mt-8" cardOutline>
          {okLabel}
        </Button>
      </div>
    </div>
  ) : null
