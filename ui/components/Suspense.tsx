import {
  FunctionComponent,
  Suspense as OldSuspense,
  SuspenseProps as OldSuspenseProps,
} from "react"

import { Loader, LoaderProps } from "@/components"

interface SuspenseProps extends Partial<OldSuspenseProps> {
  loader?: LoaderProps
}

export const Suspense: FunctionComponent<SuspenseProps> = ({
  children,
  fallback,
  loader,
  ...props
}) => (
  <OldSuspense fallback={fallback ?? <Loader {...loader} />} {...props}>
    {children}
  </OldSuspense>
)
