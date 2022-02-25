import cn from "classnames"
import { FunctionComponent, PropsWithChildren } from "react"
import { IoClose } from "react-icons/io5"
import { useRecoilState } from "recoil"

import { Button, CardWrapper } from "@/components"
import { betaAlertAcceptedAtom } from "@/state"

interface AlertProps {
  title: string
  visible: boolean
  hide?: () => void
  // Display Alert below global loader display. Default above.
  belowLoaders?: boolean
}

export const Alert: FunctionComponent<PropsWithChildren<AlertProps>> = ({
  children,
  title,
  visible,
  hide,
  belowLoaders = false,
}) => (
  <div
    className={cn(
      "flex justify-center items-center fixed bg-dark/90 top-0 right-0 bottom-0 left-0 transition",
      {
        "cursor-pointer": hide,

        "opacity-0 pointer-events-none": !visible,
        "opacity-100": visible,
      },
      {
        "z-50": !belowLoaders,
        "z-30": belowLoaders,
      }
    )}
    onClick={
      hide
        ? ({ target, currentTarget }) => target === currentTarget && hide()
        : undefined
    }
  >
    <CardWrapper className="flex flex-col justify-start items-start relative m-8 max-w-xl max-h-[90vh] overflow-y-auto cursor-auto">
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
    </CardWrapper>
  </div>
)

export const BetaAlert: FunctionComponent<Partial<AlertProps>> = (props) => {
  const [betaAlertAccepted, setBetaAlertAccepted] = useRecoilState(
    betaAlertAcceptedAtom
  )

  return (
    <Alert {...props} visible={!betaAlertAccepted} title="We are in beta">
      <p className="mb-4">DAO Up! is in beta and has not yet been audited.</p>

      <p>
        DAO UP! IS PROVIDED &ldquo;AS IS&rdquo;, AT YOUR OWN RISK, AND WITHOUT
        WARRANTIES OF ANY KIND. No developer or entity involved in creating the
        DAO UP! UI or smart contracts will be liable for any claims or damages
        whatsoever associated with your use, inability to use, or your
        interaction with other users of DAO UP!, including any direct, indirect,
        incidental, special, exemplary, punitive or consequential damages, or
        loss of profits, cryptocurrencies, tokens, or anything else of value.
      </p>

      <Button className="mt-6" onClick={() => setBetaAlertAccepted(true)}>
        I understand and accept.
      </Button>
    </Alert>
  )
}
