import { FC, Suspense as OldSuspense, SuspenseProps } from "react"

import { Loader } from "."

export const Suspense: FC<Partial<SuspenseProps>> = ({
  children,
  fallback,
  ...props
}) => (
  <OldSuspense fallback={fallback ?? <Loader overlay />} {...props}>
    {children}
  </OldSuspense>
)
