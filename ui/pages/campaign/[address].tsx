import cn from "classnames"
import type { NextPage } from "next"
import { useRouter } from "next/router"
import { FC, PropsWithChildren, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { IconType } from "react-icons"
import { FaDiscord, FaTwitter } from "react-icons/fa"
import TimeAgo from "react-timeago"

import {
  Button,
  ButtonLink,
  CampaignImage,
  CampaignProgress,
  CampaignStatus,
  CenteredColumn,
  FormInput,
  Loader,
  ResponsiveDecoration,
  TooltipInfo,
} from "../../components"
import { prettyPrintDecimal } from "../../helpers/number"
import { useWallet } from "../../helpers/wallet"
import { getCampaign } from "../../services/campaigns"

const CampaignPageWrapper: FC<PropsWithChildren<{}>> = ({ children }) => (
  <>
    <ResponsiveDecoration
      name="campaign_orange_blur.png"
      width={341}
      height={684}
      className="top-0 left-0 opacity-70"
    />

    {children}
  </>
)

interface CampaignLinkProps {
  href: string
  label: string
  Icon?: IconType
}
const CampaignLink: FC<CampaignLinkProps> = ({ href, label, Icon }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "mr-4 last:mr-0",
      "flex flex-row items-center",
      "hover:opacity-70"
    )}
  >
    {!!Icon && <Icon className="mr-1" size={18} />}
    {label}
  </a>
)

interface ActivityItemProps {
  campaign: Campaign
  item: ActivityItem
}
const ActivityItem: FC<ActivityItemProps> = ({
  campaign: { tokenSymbol },
  item: { when, address, amount },
}) => (
  <div className={cn("py-5", "border-b border-light")}>
    <div className="flex flex-row justify-between items-center">
      <p className="font-semibold">
        {amount} {tokenSymbol}
      </p>
      <TimeAgo date={when} />
    </div>
    <p>{address}</p>
  </div>
)

interface ContributionForm {
  contribution?: number
}

interface RefundForm {
  refund?: number
}

const Campaign: NextPage<SetLoadingProps> = ({ setLoading }) => {
  const { query, isReady, push: routerPush } = useRouter()
  const { setWallet } = useWallet()
  const [campaign, setCampaign] = useState<Campaign | null>(null)

  // Contribution Form
  const {
    handleSubmit: contributionHandleSubmit,
    register: contributionRegister,
    formState: { errors: contributionErrors },
  } = useForm({
    defaultValues: {} as ContributionForm,
  })

  // Refund Form
  const {
    handleSubmit: refundHandleSubmit,
    register: refundRegister,
    formState: { errors: refundErrors },
    watch: refundWatch,
  } = useForm({
    defaultValues: {} as RefundForm,
  })

  // Fetch campaign, and redirect to campaigns page if not found.
  useEffect(() => {
    if (!isReady) return

    const fetchCampaign = async () => {
      setLoading(true)
      if (typeof query.address !== "string")
        throw new Error("Invalid campaign address.")

      const campaign = await getCampaign(setWallet, query.address)
      if (!campaign) throw new Error("Invalid campaign address.")

      setCampaign(campaign)
      setLoading(false)
    }

    fetchCampaign().catch((error) => {
      console.error(error)
      // TODO: Display error message.

      routerPush("/campaigns")
    })
  }, [isReady, query.address, setCampaign, routerPush, setWallet, setLoading])

  // Show loader when not ready.
  useEffect(() => {
    setLoading(!isReady)
  }, [setLoading, isReady])

  // If page not ready or no campaign found, display loader.
  if (!isReady || !campaign) return <CampaignPageWrapper />

  // Contribution Form
  const doContribution = ({ contribution }: ContributionForm) => {
    console.log(contribution)
  }

  // Refund Form
  const watchRefund = refundWatch("refund")
  const doRefund = ({ refund }: RefundForm) => {
    console.log(refund)
  }

  const {
    name,
    description,
    daoUrl,

    website,
    twitter,
    discord,

    tokenSymbol,
    goal,
    pledged,
    supporters,
    supply,

    activity,
  } = campaign ?? {}

  const overfunded = pledged > goal

  const userTokens: number = 1

  return (
    <CampaignPageWrapper>
      {!!daoUrl && (
        <p className="bg-green text-dark text-center w-full px-12 py-2">
          {name} has been successfully funded and the{" "}
          <a
            href={daoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            DAO
          </a>{" "}
          has been created.
        </p>
      )}

      <CenteredColumn className="pt-10 pb-12 sm:pt-20 2xl:w-2/3">
        <div
          className={cn(
            "flex flex-col justify-start items-center",
            "lg:flex-row lg:justify-between lg:items-stretch"
          )}
        >
          <div
            className={cn(
              "flex flex-col justify-between items-stretch w-full lg:w-3/5"
            )}
          >
            <div className={cn("flex flex-col text-center lg:text-left")}>
              <div className={cn("flex flex-col items-center", "lg:flex-row")}>
                <CampaignImage
                  campaign={campaign}
                  className="mb-4 lg:mb-0 lg:mr-4"
                  size={139}
                />

                <div className={cn("flex flex-col")}>
                  <h1 className="font-medium text-5xl">{name}</h1>

                  {!!(website || twitter || discord) && (
                    <div
                      className={cn(
                        "flex flex-row items-center",
                        "text-green",
                        "mt-4"
                      )}
                    >
                      {!!website && (
                        <CampaignLink
                          href={website}
                          label={new URL(website).hostname}
                        />
                      )}
                      {!!twitter && (
                        <CampaignLink
                          href={`https://twitter.com/${twitter}`}
                          label={(twitter.startsWith("@") ? "" : "@") + twitter}
                          Icon={FaTwitter}
                        />
                      )}
                      {!!discord && (
                        <CampaignLink
                          href={discord}
                          label="Discord"
                          Icon={FaDiscord}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-4">{description}</p>

              {overfunded && (
                <p className="flex flex-row items-center mt-8">
                  This campaign is overfunded.
                  <TooltipInfo text="" />
                </p>
              )}
            </div>

            <form
              onSubmit={contributionHandleSubmit(doContribution)}
              className={cn(
                "flex flex-col items-stretch mt-8",
                "sm:flex-row sm:items-start lg:self-stretch lg:my-0",
                { hidden: !open }
              )}
            >
              <FormInput
                type="number"
                inputMode="decimal"
                placeholder="Contribute..."
                wrapperClassName="!mb-4 sm:!mb-0 sm:mr-4 sm:flex-1"
                className="!py-3 !px-6 !pr-28"
                tail="USD"
                error={contributionErrors?.contribution?.message}
                {...contributionRegister("contribution", {
                  required: "Required",
                  valueAsNumber: true,
                  pattern: /^\s*\d+\s*$/,
                  min: {
                    value: 0,
                    message: "Must be greater than 0.",
                  },
                })}
              />

              <Button
                className="sm:h-[50px]"
                submitLabel="Support this Campaign"
              />
            </form>
          </div>

          <div
            className={cn(
              "bg-card rounded-3xl p-8 mt-8",
              "flex flex-col items-start self-stretch"
            )}
          >
            <CampaignStatus campaign={campaign} className="mb-2" />

            {!!daoUrl && (
              <ButtonLink href={daoUrl} className="self-stretch my-2">
                Visit the DAO
              </ButtonLink>
            )}

            <CampaignProgress campaign={campaign} className="mt-2" />

            <h3 className="mt-2 text-green text-3xl">
              {pledged.toLocaleString()} {tokenSymbol}
            </h3>
            <p className="text-light text-sm">
              pledged out of {goal.toLocaleString()} {tokenSymbol} goal.
            </p>

            <h3 className="mt-6 text-green text-3xl">
              {supporters.toLocaleString()}
            </h3>
            <p className="text-light text-sm">Supporters</p>

            <h3 className="mt-6 text-green text-3xl">
              {supply.toLocaleString()}
            </h3>
            <p className="text-light text-sm">Total Supply</p>
          </div>
        </div>

        <div
          className={cn(
            "bg-card rounded-3xl",
            "mt-8 py-8 px-12 w-full lg:w-3/5"
          )}
        >
          <h2 className="text-xl text-green mb-2">Your Balance</h2>
          <p className="text-light">
            {userTokens} {tokenSymbol}{" "}
            <span className="text-placeholder ml-2">
              {prettyPrintDecimal((100 * userTokens) / supply, 6)}% of total
              supply
            </span>
          </p>

          <div className={cn({ hidden: !open || userTokens === 0 })}>
            <h2 className="text-xl text-green mt-8 mb-4">Refunds</h2>

            <form onSubmit={refundHandleSubmit(doRefund)}>
              <FormInput
                type="number"
                inputMode="decimal"
                placeholder={prettyPrintDecimal(userTokens * 0.5, 6)}
                accent={
                  typeof watchRefund === "number" && !isNaN(watchRefund)
                    ? `${prettyPrintDecimal(
                        (100 * watchRefund) / userTokens,
                        2
                      )}%`
                    : "USD conversions will appear as you type."
                }
                tail={tokenSymbol}
                error={refundErrors?.refund?.message}
                {...refundRegister("refund", {
                  required: "Required",
                  valueAsNumber: true,
                  pattern: /^\s*\d+\s*$/,
                  min: {
                    value: 0,
                    message: "Must be greater than 0.",
                  },
                  max: {
                    value: userTokens,
                    message: `Must be less than your token balance: ${userTokens} ${tokenSymbol}.`,
                  },
                })}
              />

              <Button submitLabel="Refund" className="mt-4" />
            </form>
          </div>
        </div>

        <h2 className="text-green text-xl mt-8">Activity</h2>
        <div className=" w-full lg:w-3/5">
          {activity.length ? (
            activity.map((item) => (
              <ActivityItem
                key={item.when.toString()}
                campaign={campaign}
                item={item}
              />
            ))
          ) : (
            <p>None yet.</p>
          )}
        </div>
      </CenteredColumn>
    </CampaignPageWrapper>
  )
}

export default Campaign
