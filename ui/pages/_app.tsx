import "../styles/globals.scss"

import cn from "classnames"
import type { AppProps } from "next/app"
import Head from "next/head"
import { FC } from "react"
import { RecoilRoot, useRecoilValue } from "recoil"

import { Header, Loader, Suspense } from "../components"
import { globalLoadingAtom } from "../state/loading"

const Title = "DAO Up!"
const Description = ""
const Domain = "https://dao-up.net"
const ImageUrl = "https://dao-up.net/image.png"

const DAOUp: FC<AppProps> = ({ Component, pageProps }) => {
  const loading = useRecoilValue(globalLoadingAtom)

  return (
    <>
      <Header />

      <Loader
        containerClassName={cn(
          "fixed z-50 bg-dark/80 top-0 right-0 bottom-0 left-0",
          {
            hidden: !loading,
          }
        )}
      />

      <Suspense loader={{ overlay: true }}>
        <main>
          <Component {...pageProps} />
        </main>
      </Suspense>
    </>
  )
}

const App: FC<AppProps> = (props) => (
  <>
    <Head>
      <title>{Title}</title>

      {/* General */}
      <meta
        name="viewport"
        content="width=device-width, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
      />
      <link rel="icon" href="/images/logo.svg" />

      {/* SEO */}
      <meta name="description" content={Description} />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />

      {/* Social */}
      {/* Twitter */}
      <meta
        name="twitter:card"
        content="Consolidated substance and interaction information"
      />
      <meta name="twitter:title" content={Title} />
      <meta name="twitter:description" content={Description} />
      <meta name="twitter:image" content={ImageUrl} />
      {/* Open Graph */}
      <meta property="og:title" content={Title} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={Domain} />
      <meta property="og:image" content={ImageUrl} />
      <meta property="og:description" content={Description} />
      <meta property="og:site_name" content={Title} />
    </Head>

    <RecoilRoot>
      <DAOUp {...props} />
    </RecoilRoot>
  </>
)

export default App
