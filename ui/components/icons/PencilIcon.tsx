import { SVGProps } from "react"

export const PencilIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.1061 -0.000976562C10.5644 -0.000976562 11.0038 0.182017 11.3246 0.505418L13.4953 2.67604C13.8184 2.99921 14 3.43753 14 3.89457C14 4.35161 13.8184 4.78992 13.4953 5.1131L5.57024 13.0356C5.0813 13.5996 4.38822 13.9462 3.59421 14.0006H0V13.3006L0.00227335 10.3501C0.0619066 9.61198 0.405066 8.92563 0.928545 8.46439L8.88675 0.506262C9.20945 0.181604 9.64832 -0.000976562 10.1061 -0.000976562ZM3.54478 12.6024C3.91874 12.5759 4.26683 12.4019 4.54635 12.0821L9.83995 6.78853L7.21189 4.16037L1.88727 9.48371C1.60367 9.73455 1.42822 10.0855 1.4 10.4065V12.6011L3.54478 12.6024ZM8.20196 3.17054L10.8299 5.79858L12.5053 4.12315C12.566 4.06253 12.6 3.98031 12.6 3.89457C12.6 3.80884 12.566 3.72662 12.5053 3.66599L10.3328 1.49342C10.2728 1.43301 10.1912 1.39902 10.1061 1.39902C10.021 1.39902 9.93943 1.43301 9.87948 1.49342L8.20196 3.17054Z"
      fill={props.color}
    />
  </svg>
)
