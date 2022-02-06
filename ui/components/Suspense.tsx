import {
  FC,
  Suspense as OldSuspense,
  SuspenseProps as OldSuspenseProps,
} from "react"

import { Loader, LoaderProps } from "."

interface SuspenseProps extends Partial<OldSuspenseProps> {
  loader?: LoaderProps
}
export const Suspense: FC<SuspenseProps> = ({
  children,
  fallback,
  loader,
  ...props
}) => (
  <OldSuspense fallback={fallback ?? <Loader {...loader} />} {...props}>
    {children}
  </OldSuspense>
)
