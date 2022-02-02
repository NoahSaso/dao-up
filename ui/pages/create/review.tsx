import cn from "classnames"
import type { NextPage } from "next"
import Image from "next/image"
import Link from "next/link"
import { FC, PropsWithChildren, useState } from "react"
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
import { newCampaignFieldEntries } from "../../services/campaigns"
import { newCampaignState } from "../../services/state"

interface FieldDisplayProps {
  newCampaign: Partial<NewCampaign>
  fieldKey: keyof NewCampaign
  field: NewCampaignField
}
const FieldDisplay: FC<FieldDisplayProps> = ({
  newCampaign,
  fieldKey,
  field: { label, unitBefore, unitAfter, render },
}) => (
  <div className="flex flex-col mt-6">
    <p className="text-green mr-4">{label}</p>
    <p className="text-light mr-5">
      {unitBefore?.(newCampaign) ?? ""}
      {render(newCampaign[fieldKey], newCampaign)}
      {unitAfter?.(newCampaign) ?? ""}
    </p>
  </div>
)

const renderFieldDisplay = (
  newCampaign: Partial<NewCampaign>,
  [key, field]: [keyof NewCampaign, NewCampaignField]
) => (
  <FieldDisplay
    newCampaign={newCampaign}
    key={key}
    fieldKey={key}
    field={field}
  />
)

interface CardProps {
  label: string
  pageId: number
  flat?: boolean
}
const Card: FC<PropsWithChildren<CardProps>> = ({
  label,
  pageId,
  flat,
  children,
}) => (
  <Link href={`/create${`/${pageId > 1 ? pageId : ""}`}`}>
    <a
      className={cn("flex flex-col mt-6", { "bg-card rounded-3xl p-8": !flat })}
    >
      <div className="flex flex-row items-center mb-2">
        <h2 className="text-2xl mr-3">{label}</h2>
        <Image src="/images/pencil.svg" alt="edit" width={18} height={18} />
      </div>

      {children}
    </a>
  </Link>
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

        <Card label="Campaign Overview" pageId={1}>
          {newCampaignFieldEntries
            .filter(([_, { pageId }]) => pageId === 1)
            .map(([key, field]) => (
              <FieldDisplay
                newCampaign={newCampaign}
                key={key}
                fieldKey={key}
                field={field}
              />
            ))}
        </Card>

        <Card label="DAO Overview" pageId={2}>
          {newCampaignFieldEntries
            .filter(([_, { pageId }]) => pageId === 2)
            .map((entry) => renderFieldDisplay(newCampaign, entry))}
        </Card>

        <Card label="Campaign Details" pageId={3}>
          {newCampaignFieldEntries
            .filter(([_, { pageId }]) => pageId === 3)
            .map((entry) => renderFieldDisplay(newCampaign, entry))}
        </Card>

        <Card label="Token Configuration" pageId={4}>
          {newCampaignFieldEntries
            .filter(([_, { pageId, advanced }]) => pageId === 4 && !advanced)
            .map((entry) => renderFieldDisplay(newCampaign, entry))}
        </Card>

        <VisibilityToggle
          visible={showingAdvanced}
          showLabel="Show Advanced Settings"
          hideLabel="Hide Advanced Settings"
          onClick={() => setShowingAdvanced((a) => !a)}
          toggleClassName="mt-10 mb-4"
        >
          <Card label="Advanced Configuration" pageId={4} flat>
            {newCampaignFieldEntries
              .filter(([_, { pageId, advanced }]) => pageId === 4 && advanced)
              .map((entry) => renderFieldDisplay(newCampaign, entry))}
          </Card>
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
