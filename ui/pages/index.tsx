import classNames from "classnames"
import cn from "classnames"
import type { NextPage } from "next"
import Image from "next/image"
import { FC, ReactNode } from "react"

import styles from "../styles/Home.module.css"

interface CenteredColumnProps {
  children: ReactNode | ReactNode[]
  className?: string
}
const CenteredColumn: FC<CenteredColumnProps> = ({ children, className }) => (
  <div className={classNames(`w-5/6 my-0 mx-auto`, className)}>{children}</div>
)

const Home: NextPage = () => {
  return (
    <>
      <CenteredColumn className="pt-5">
        <h1 className="text-center text-4xl">
          Trusted Community Fundraising
          <br />
          for any Campaign
        </h1>
      </CenteredColumn>
    </>
  )
}

export default Home
