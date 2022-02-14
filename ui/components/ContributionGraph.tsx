import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
} from "chart.js"
import { FC } from "react"
import { Line } from "react-chartjs-2"

import { payTokenSymbol } from "../helpers/config"
import theme from "../helpers/theme"
import { CampaignActionType } from "../types"

ChartJS.register(LinearScale, LineElement, CategoryScale, PointElement)

interface ContributionGraphProps {
  actions: CampaignAction[]
}

export const ContributionGraph: FC<ContributionGraphProps> = ({ actions }) => {
  const cumSum = (
    (sum: number) => (x: number) =>
      (sum += x)
  )(0)

  // Start at 0, and reverse actions since they're originally in descending order.
  const data = [
    0,
    // Reverse mutates, so spread into a new array before reversing.
    ...[...actions]
      .reverse()
      .map(({ type, amount }) =>
        cumSum(type === CampaignActionType.Refund ? -amount : amount)
      ),
  ]

  return (
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
              color: theme.colors.gray,
            },
            ticks: {
              color: theme.colors.gray,
            },
            grid: {
              borderColor: theme.colors.gray,
              color: theme.colors.gray,
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
  )
}
