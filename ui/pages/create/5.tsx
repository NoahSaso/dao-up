import cn from "classnames"
import type { NextPage } from "next"
import { FieldValues, SubmitHandler } from "react-hook-form"
import { useRecoilState } from "recoil"

import {
  Button,
  ButtonLink,
  CenteredColumn,
  ResponsiveDecoration,
} from "../../components"
import { prettyPrintDecimal } from "../../helpers/number"
import { newCampaignState } from "../../services/state"

const Create5: NextPage = () => {
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

        {JSON.stringify(newCampaign, null, 2)}

        <div className="flex flex-row justify-between align-center">
          <ButtonLink href="/create/4">Back</ButtonLink>
          <Button onClick={create}>Create Campaign</Button>
        </div>
      </CenteredColumn>
    </>
  )
}

export default Create5
