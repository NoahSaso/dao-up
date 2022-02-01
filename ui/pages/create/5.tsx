import type { NextPage } from "next"
import Image from "next/image"
import Link from "next/link"
import { FC, useState } from "react"
import { FieldValues, SubmitHandler } from "react-hook-form"
import { useRecoilState } from "recoil"

import {
  Button,
  ButtonLink,
  CenteredColumn,
  ResponsiveDecoration,
  VisibilityToggle,
} from "../../components"
import { useNewCampaignForm } from "../../helpers/form"
import { prettyPrintDecimal } from "../../helpers/number"
import { newCampaignFieldEntries } from "../../services/campaigns"
import { newCampaignState } from "../../services/state"

interface FieldDisplayProps {
  field: string
  label: string
  pageId: number
  value?: string
}
const FieldDisplay: FC<FieldDisplayProps> = ({
  field,
  label,
  value,
  pageId,
}) => (
  <Link href={`/create${`/${pageId > 1 ? pageId : ""}`}`}>
    <a className="flex flex-col mb-6">
      <div className="flex flex-row items-center">
        <p className="text-green mr-2">{label}</p>
        <Image src="/images/pencil.svg" alt="edit" width={18} height={18} />
      </div>
      <p className="text-light mr-5">{value}</p>
      {field === "imageUrl" && !!value && (
        // image is being loaded from anywhere, so can't use next image component
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="max-w-[14rem]" />
      )}
    </a>
  </Link>
)

const renderFieldDisplay = (
  newCampaign: Partial<NewCampaign>,
  [field, { label, pageId }]: typeof newCampaignFieldEntries[number]
) => {
  const value = newCampaign[field]
  const valueStr =
    typeof value === "number" ? prettyPrintDecimal(value) : value?.toString()

  return (
    <FieldDisplay
      key={field}
      field={field}
      label={label}
      pageId={pageId}
      value={valueStr}
    />
  )
}

const Create5: NextPage = () => {
  useNewCampaignForm(5)
  const [newCampaign, _] = useRecoilState(newCampaignState)

  const [showingAdvanced, setShowingAdvanced] = useState(false)

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

        {newCampaignFieldEntries
          .filter(([_, { advanced }]) => !advanced)
          .map((entry) => renderFieldDisplay(newCampaign, entry))}

        <VisibilityToggle
          visible={showingAdvanced}
          showLabel="Show Advanced Settings"
          hideLabel="Hide Advanced Settings"
          onClick={() => setShowingAdvanced((a) => !a)}
        >
          {newCampaignFieldEntries
            .filter(([_, { advanced }]) => !advanced)
            .map((entry) => renderFieldDisplay(newCampaign, entry))}
        </VisibilityToggle>

        <div className="flex flex-row justify-between items-center mt-10">
          <ButtonLink href="/create/4">Back</ButtonLink>
          <Button onClick={create}>Create Campaign</Button>
        </div>
      </CenteredColumn>
    </>
  )
}

export default Create5
