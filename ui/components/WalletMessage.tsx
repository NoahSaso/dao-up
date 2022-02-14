import { FC } from "react"

import { useWallet } from "../hooks/useWallet"
import { InstallWalletMessage } from "../services/keplr"
import { CardWrapper } from "."
import { Button } from "./Button"

export const WalletMessage: FC = () => {
  const { connect, connectError, installed } = useWallet()

  return (
    <CardWrapper className="self-stretch border border-orange">
      {installed ? (
        <>
          <p className="text-orange">
            You haven&apos;t connected your wallet. Connect one to contribute,
            view your balance, and refund.
          </p>
          <Button className="mt-4" onClick={connect}>
            Connect wallet
          </Button>
          {!!connectError && <p className="text-orange mt-2">{connectError}</p>}
        </>
      ) : (
        <p className="text-orange text-md font-bold">
          <InstallWalletMessage />
        </p>
      )}
    </CardWrapper>
  )
}
