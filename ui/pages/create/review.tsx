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
    <a className="flex flex-col mt-6">
      <div className="flex flex-row items-center">
        <p className="text-green mr-2 whitespace-pre-wrap">{label}</p>
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

const valueToString = (
  value:
    | string
    | number
    | boolean
    | InitialDistribution[]
    | InitialDistribution
    | undefined
): string => {
  if (typeof value === "number") return prettyPrintDecimal(value)

  if (typeof value === "string" || typeof value === "boolean")
    return value.toString()

  // InitialDistribution[]
  if (Array.isArray(value))
    return value
      .map((v, idx) => `#${idx + 1}\n${valueToString(v)}`)
      .join("\n\n")

  if (typeof value === "object")
    return Object.entries(value)
      .map(
        ([k, v]) =>
          `${
            k.charAt(0).toUpperCase() + k.substring(1).toLowerCase()
          }: ${valueToString(v as string | number)}`
      )
      .join("\n")

  return ""
}

const renderFieldDisplay = (
  newCampaign: Partial<NewCampaign>,
  [field, { label, pageId }]: typeof newCampaignFieldEntries[number]
) => (
  <FieldDisplay
    key={field}
    field={field}
    label={label}
    pageId={pageId}
    value={valueToString(newCampaign[field])}
  />
)

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
          toggleClassName="mt-10 mb-4"
        >
          {newCampaignFieldEntries
            .filter(([_, { advanced }]) => advanced)
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
