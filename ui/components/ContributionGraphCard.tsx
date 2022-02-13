import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
} from "chart.js"
import cn from "classnames"
import { FC } from "react"
import { Line } from "react-chartjs-2"

import { payTokenSymbol } from "../helpers/config"
import theme from "../helpers/theme"
import { CampaignActionType } from "../types"

ChartJS.register(LinearScale, LineElement, CategoryScale, PointElement)

interface ContributionGraphCardProps {
  actions: CampaignAction[]
  className?: string
}

export const ContributionGraphCard: FC<ContributionGraphCardProps> = ({
  actions,
  className,
}) => {
  const cumSum = (
    (sum: number) => (x: number) =>
      (sum += x)
  )(0)

  // Start at 0, and reverse actions since they're originally in descending order.
  const data = [
    0,
    // Reverse mutates, so spready into a new array before reversing.
    ...[...actions]
      .reverse()
      .map(({ type, amount }) =>
        cumSum(type === CampaignActionType.Refund ? -amount : amount)
      ),
  ]

  return (
    <div
      className={cn(
        "bg-card rounded-3xl p-8 overflow-hidden flex-1",
        className
      )}
    >
      <p className="text-green mb-2">Contributions</p>

      <Line
        options={{
          // Disable all events (hover, tooltip, etc.)
          events: [],
          animation: false,
          elements: {
            point: {
              radius: 0,
            },
          },
          scales: {
            x: {
              display: false,
            },
            y: {
              display: true,
              title: {
                text: payTokenSymbol,
                display: true,
                color: theme.colors.dark,
              },
              ticks: {
                color: theme.colors.dark,
              },
              grid: {
                borderColor: theme.colors.dark,
                color: theme.colors.dark,
              },
            },
          },
        }}
        data={{
          labels: data.map(() => ""),
          datasets: [
            {
              data,
              borderColor: theme.colors.green,
            },
          ],
        }}
      />
    </div>
  )
}
