import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
} from "chart.js"
import { FC } from "react"
import { Line } from "react-chartjs-2"

import theme from "../helpers/theme"

ChartJS.register(LinearScale, LineElement, CategoryScale, PointElement)

interface ContributionGraphCardProps {
  actions: CampaignAction[]
}

export const ContributionGraphCard: FC<ContributionGraphCardProps> = ({
  actions,
}) => {
  const cumSum = (
    (sum: number) => (x: number) =>
      (sum += x)
  )(0)

  return (
    <div className="bg-card rounded-3xl p-8 flex flex-col items-start max-w-full">
      <Line
        options={{
          // Disable all events (hover, tooltip, etc.)
          events: [],
          animation: false,
          backgroundColor: theme.colors.dark,
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
              display: false,
            },
          },
        }}
        data={{
          labels: actions.map(() => ""),
          datasets: [
            {
              data: actions.map(({ amount }) => cumSum(amount)),
              borderColor: theme.colors.green,
            },
          ],
        }}
      />
    </div>
  )
}
