import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
} from "chart.js"
import { FunctionComponent } from "react"
import { Line } from "react-chartjs-2"

import theme from "@/theme"

ChartJS.register(LinearScale, LineElement, CategoryScale, PointElement)

interface ContributionGraphProps {
  campaign: Campaign
  actions: CampaignAction[]
}

export const ContributionGraph: FunctionComponent<ContributionGraphProps> = ({
  campaign: { payToken },
  actions,
}) => (
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
            text: payToken.symbol,
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
      labels: actions.map(() => ""),
      datasets: [
        {
          // Reverse data since actions are in descending order, but we want the graph to display an increasing line.
          data: actions.map(({ total }) => total).reverse(),
          borderColor: theme.colors.green,
        },
      ],
    }}
  />
)
