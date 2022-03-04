import { FunctionComponent } from "react"

import { chainTxnUrlPrefix } from "@/config"

interface TxnPollTimeoutErrorProps {
  transactionId?: string
}

export const TxnPollTimeoutError: FunctionComponent<
  TxnPollTimeoutErrorProps
> = ({ transactionId }) => (
  <>
    Transaction sent but has not yet been detected.{" "}
    {chainTxnUrlPrefix && transactionId ? (
      <>
        <a
          href={chainTxnUrlPrefix + transactionId}
          target="_blank"
          rel="noopener noreferrer"
          className="inline hover:underline text-green"
        >
          Click here to view the latest transaction details on JunoScan.
        </a>{" "}
        If the transaction was already successful, refresh this page to view its
        changes or check back later.
      </>
    ) : (
      <>
        Refresh this page to view its changes or check back later.
        {transactionId && ` Transaction ID: ${transactionId}`}
      </>
    )}
  </>
)
