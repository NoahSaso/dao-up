import cn from "classnames"
import type { NextPage } from "next"
import Image from "next/image"
import Link from "next/link"
import { FC } from "react"
import { FieldValues, SubmitHandler } from "react-hook-form"
import { useRecoilState } from "recoil"

import {
  Button,
  ButtonLink,
  CenteredColumn,
  ResponsiveDecoration,
} from "../../components"
import { useNewCampaignForm } from "../../helpers/form"
import { prettyPrintDecimal } from "../../helpers/number"
import { newCampaignState } from "../../services/state"

interface PropertyDisplayProps {
  label: string
  value: string
  page: string
}
const PropertyDisplay: FC<PropertyDisplayProps> = ({ label, value, page }) => (
  <Link href={`/create${page}`}>
    <a className="flex flex-col mb-10">
      <div className="flex flex-row items-center">
        <p className="text-green mr-2">{label}</p>
        <Image src="/images/pencil.svg" alt="edit" width={18} height={18} />
      </div>
      <p className="text-light mr-5">{value}</p>
    </a>
  </Link>
)

const Create5: NextPage = () => {
  useNewCampaignForm(5)
  const [newCampaign, _] = useRecoilState(newCampaignState)

  const create: SubmitHandler<FieldValues> = () => {
    alert("WOO\n" + JSON.stringify(newCampaign, null, 2))
    console.log(newCampaign)
  }

  return (
    <>
      <ResponsiveDecoration
        name="campaigns_orange_blur.png"
        width={406}
        height={626}
        className="top-0 right-0 opacity-70"
      />

      <CenteredColumn className="py-10 max-w-4xl">
        <h1 className="font-semibold text-4xl mb-10">
          Review Campaign Settings
        </h1>

        <PropertyDisplay
          label="Campaign Name"
          value={newCampaign.name}
          page="/"
        />

        <PropertyDisplay
          label="Campaign Description"
          value={newCampaign.description}
          page="/"
        />

        <PropertyDisplay
          label="Funding Target"
          value={prettyPrintDecimal(newCampaign.goal, 2)}
          page="/"
        />

        <div className="flex flex-row justify-between align-center mt-10">
          <ButtonLink href="/create/4">Back</ButtonLink>
          <Button onClick={create}>Create Campaign</Button>
        </div>
      </CenteredColumn>
    </>
  )
}

export default Create5
