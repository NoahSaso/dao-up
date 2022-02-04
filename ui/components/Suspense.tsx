import { FC, Suspense as OldSuspense, SuspenseProps } from "react"

import { Loader } from "."

export const Suspense: FC<Omit<SuspenseProps, "fallback">> = ({
  children,
  ...props
}) => (
  <OldSuspense
    fallback={
      <Loader containerClassName="fixed z-50 bg-dark/80 top-0 right-0 bottom-0 left-0" />
    }
    {...props}
  >
    {children}
  </OldSuspense>
)
