import "../styles/globals.scss"

import type { AppProps } from "next/app"
import Head from "next/head"
import { FunctionComponent } from "react"
import { RecoilRoot, useRecoilValue } from "recoil"

import { BetaAlert, Footer, Header, Loader, Suspense } from "@/components"
import { description, imageUrl, title } from "@/config"
import { globalLoadingAtom } from "@/state"

const DAOUp: FunctionComponent<AppProps> = ({ Component, pageProps }) => {
  const loading = useRecoilValue(globalLoadingAtom)

  return (
    <>
      <Header />

      {loading && <Loader overlay />}

      <Suspense loader={{ overlay: true }}>
        <main>
          <Component {...pageProps} />

          {/* Manages its own visibility and state localStorage. */}
          <BetaAlert />
        </main>
      </Suspense>

      <Footer />
    </>
  )
}

const App: FunctionComponent<AppProps> = (props) => (
  <>
    <Head>
      {/* General */}
      <meta
        name="viewport"
        content="width=device-width, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
      />
      <link rel="icon" href="/images/logo.svg" />

      {/* Analytics */}
      <script
        defer
        data-domain="daoup.zone"
        src="https://plausible.io/js/plausible.js"
      ></script>

      {/* SEO */}
      <meta name="description" content={description} />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />

      {/* Social */}
      {/* Twitter */}
      <meta
        name="twitter:card"
        content="Kick start your community with the crowdfunding platform for DAOs."
        key="twitter:card"
      />
      <meta name="twitter:title" content={title} key="twitter:title" />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} key="twitter:image" />
      {/* Open Graph */}
      <meta property="og:title" content={title} key="og:title" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={imageUrl} key="og:image" />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={title} />
    </Head>

    <RecoilRoot>
      <DAOUp {...props} />
    </RecoilRoot>
  </>
)

export default App
