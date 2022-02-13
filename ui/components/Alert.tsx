import cn from "classnames"
import { FC, PropsWithChildren } from "react"
import { IoClose } from "react-icons/io5"

import { Button } from "."

interface AlertProps {
  title: string
  visible: boolean
  hide?: () => void
}

export const Alert: FC<PropsWithChildren<AlertProps>> = ({
  children,
  title,
  visible,
  hide,
}) =>
  visible ? (
    <div
      className={cn(
        "flex justify-center items-center fixed z-50 bg-dark/90 top-0 right-0 bottom-0 left-0",
        { "cursor-pointer": !hide }
      )}
      onClick={
        hide
          ? ({ target, currentTarget }) => target === currentTarget && hide()
          : undefined
      }
    >
      <div className="flex flex-col bg-card rounded-3xl relative p-8 m-8 max-w-xl cursor-auto">
        {!!hide && (
          <Button
            onClick={hide}
            className="absolute top-4 right-4 text-placeholder"
            bare
          >
            <IoClose size={22} />
          </Button>
        )}

        <h1 className="text-3xl mb-4 font-medium text-green">{title}</h1>

        {children}
      </div>
    </div>
  ) : null
