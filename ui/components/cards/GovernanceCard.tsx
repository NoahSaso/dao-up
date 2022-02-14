import { ArcElement, Chart as ChartJS } from "chart.js"
import cn from "classnames"
import { FC } from "react"
import { Pie } from "react-chartjs-2"

import { prettyPrintDecimal } from "../../helpers/number"
import theme from "../../helpers/theme"
import { CardWrapper } from ".."

ChartJS.register(ArcElement)

interface PieLegendProps {
  items: {
    label: string
    color: string
  }[]
  className?: string
}
const PieLegend: FC<PieLegendProps> = ({ items, className }) => (
  <div className={cn("flex flex-col", className)}>
    {items.map(({ label, color: backgroundColor }) => (
      <div key={label} className="flex flex-row items-center mt-1 first:mt-0">
        <div
          className="w-10 h-5 mr-2 shrink-0"
          style={{ backgroundColor }}
        ></div>
        <p className="text-light">{label}</p>
      </div>
    ))}
  </div>
)

interface GovernanceCardProps {
  campaign: Campaign
}

export const GovernanceCard: FC<GovernanceCardProps> = ({ campaign }) => {
  const {
    govToken: {
      campaignBalance: govTokenCampaignBalance,
      daoBalance: govTokenDAOTreasuryBalance,
      supply: govTokenSupply,
    },
  } = campaign

  // DAO voting power of campaign, determined by proportion of campaign's governance token balance
  // to all governance tokens not in the DAO's treasury.
  const campaignVotingPower =
    (100 * govTokenCampaignBalance) /
    (govTokenSupply - govTokenDAOTreasuryBalance)
  // DAO voting power of existing DAO members.
  const govTokenDAOMemberBalance =
    govTokenSupply - govTokenDAOTreasuryBalance - govTokenCampaignBalance

  return (
    <CardWrapper className="flex flex-col items-start max-w-full">
      <h3 className="text-green text-3xl">
        {prettyPrintDecimal(campaignVotingPower, 2)}% governance
      </h3>
      <p className="text-light text-sm">
        Campaign backers will have {prettyPrintDecimal(campaignVotingPower, 2)}%
        voting power in the DAO. Voting power ignores the DAO&apos;s treasury
        balance. To learn more,{" "}
        <a
          href="https://docs.daoup.zone/evaluating-campaigns#what-is-a-good-percentage-of-governance-power"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline"
        >
          read the docs
        </a>
        .
      </p>

      <Pie
        options={{
          // Disable all events (hover, tooltip, etc.)
          events: [],
          animation: false,
        }}
        data={{
          datasets: [
            {
              data: [
                govTokenDAOMemberBalance,
                govTokenDAOTreasuryBalance,
                govTokenCampaignBalance,
              ],
              backgroundColor: [
                theme.colors.pieMedium,
                theme.colors.pieDark,
                theme.colors.pieLight,
              ],
              borderWidth: 0,
            },
          ],
        }}
        className="!w-48 !h-48 mt-8 self-center"
      />

      <PieLegend
        className="mt-4"
        items={[
          {
            label: "Campaign",
            color: theme.colors.pieLight,
          },
          {
            label: "Current DAO members/creators",
            color: theme.colors.pieMedium,
          },
          {
            label: "DAO's treasury",
            color: theme.colors.pieDark,
          },
        ]}
      />
    </CardWrapper>
  )
}
