import { prettyPrintDecimal } from "../helpers/number"
import { Status } from "../types"

const renderString = (v: string) => v
const renderBoolean = (v: boolean) => (v ? "Yes" : "No")
const makeRenderNumber =
  (maxDecimals?: number, minDecimals?: number) => (v: number) =>
    prettyPrintDecimal(v, maxDecimals, minDecimals)

const renderImageUrl = (imageUrl?: string) => (
  <>
    {imageUrl}
    {!!imageUrl && (
      // image is being loaded from anywhere, so can't use next image component
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" className="mr-2 max-w-[14rem]" />
    )}
  </>
)
const renderInitialDistributions = (
  initialDistributions: InitialDistribution[] | undefined,
  newCampaign: Partial<NewCampaign>
) =>
  initialDistributions ? (
    <div className="flex flex-col">
      {initialDistributions.map(({ address, amount }, idx) => (
        <div key={idx + address} className="flex flex-col mt-4">
          <p className="">{address}:</p>
          <p className="">
            {prettyPrintDecimal(amount)} {newCampaign.tokenSymbol ?? "tokens"}
          </p>
        </div>
      ))}
    </div>
  ) : (
    "None"
  )

export const newCampaignFields: Record<keyof NewCampaign, NewCampaignField> = {
  name: {
    label: "Campaign Name",
    pageId: 1,
    required: true,
    advanced: false,
    render: renderString,
  },
  description: {
    label: "Campaign Description",
    pageId: 1,
    required: true,
    advanced: false,
    render: renderString,
  },
  goal: {
    label: "Funding Target",
    pageId: 1,
    required: true,
    advanced: false,
    unitBefore: (_) => "$",
    render: makeRenderNumber(2, 2),
  },
  displayPublicly: {
    label: "Show on public campaigns list",
    pageId: 1,
    required: false,
    advanced: false,
    render: renderBoolean,
  },

  daoName: {
    label: "DAO Name",
    pageId: 2,
    required: true,
    advanced: false,
    render: renderString,
  },
  daoDescription: {
    label: "DAO Description",
    pageId: 2,
    required: true,
    advanced: false,
    render: renderString,
  },

  website: {
    label: "Website",
    pageId: 3,
    required: false,
    advanced: false,
    render: renderString,
  },
  twitter: {
    label: "Twitter",
    pageId: 3,
    required: false,
    advanced: false,
    render: renderString,
  },
  discord: {
    label: "Discord",
    pageId: 3,
    required: false,
    advanced: false,
    render: renderString,
  },
  imageUrl: {
    label: "Image URL",
    pageId: 3,
    required: false,
    advanced: false,
    render: renderImageUrl,
  },

  tokenName: {
    label: "Token Name",
    pageId: 4,
    required: true,
    advanced: false,
    render: renderString,
  },
  tokenSymbol: {
    label: "Token Symbol",
    pageId: 4,
    required: true,
    advanced: false,
    render: renderString,
  },
  passingThreshold: {
    label: "DAO Proposal Passing Threshold",
    pageId: 4,
    required: true,
    advanced: false,
    unitAfter: (_) => "%",
    render: makeRenderNumber(),
  },
  // advanced
  initialSupply: {
    label: "Initial Token Supply",
    pageId: 4,
    required: true,
    advanced: true,
    unitAfter: (c) => ` ${c.tokenSymbol ?? "tokens"}`,
    render: makeRenderNumber(),
  },
  initialDAOAmount: {
    label: "DAO Initial Amount",
    pageId: 4,
    required: true,
    advanced: true,
    unitAfter: (c) => ` ${c.tokenSymbol ?? "tokens"}`,
    render: makeRenderNumber(),
  },
  initialDistributions: {
    label: "Initial Distributions",
    pageId: 4,
    required: true,
    advanced: true,
    render: renderInitialDistributions,
  },
  votingDuration: {
    label: "Voting Duration",
    pageId: 4,
    required: true,
    advanced: true,
    unitAfter: (_) => " seconds",
    render: makeRenderNumber(),
  },
  unstakingDuration: {
    label: "Unstaking Duration",
    pageId: 4,
    required: true,
    advanced: true,
    unitAfter: (_) => " seconds",
    render: makeRenderNumber(),
  },
  proposalDeposit: {
    label: "Proposal Deposit",
    pageId: 4,
    required: true,
    advanced: true,
    unitAfter: (c) => ` ${c.tokenSymbol ?? "tokens"}`,
    render: makeRenderNumber(),
  },
  refundProposalDeposits: {
    label: "Refund Proposal Deposits",
    pageId: 4,
    required: true,
    advanced: true,
    render: renderBoolean,
  },
}
export const newCampaignFieldEntries = Object.entries(newCampaignFields) as [
  keyof NewCampaign,
  NewCampaignField
][]

const placeholderCampaignFields = {
  status: Status.Active,
  creator: "0xa",

  daoName: "DAO",
  daoDescription: "Desc",
  daoUrl: "https://noahsaso.com",
  displayPublicly: true,

  tokenName: "Token",
  tokenSymbol: "TOK",
  tokenPrice: 1,

  passingThreshold: 50,
  initialSupply: 10000000,
  initialDAOAmount: 9000000,
  votingDuration: 60,
  unstakingDuration: 60,
  proposalDeposit: 100,
  refundProposalDeposits: true,
}

export const campaigns: Campaign[] = [
  {
    ...placeholderCampaignFields,

    address: "0xjunocontract1",
    name: "BongDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",

    goal: 100000,
    pledged: 10000,
    supporters: 10,
    supply: 100000,

    website: "https://noahsaso.com",
    twitter: "NoahSaso",
    discord: "test",

    activity: [
      {
        when: new Date(new Date().getTime() - 1 * 60 * 60 * 24 * 7),
        address: "123",
        amount: 2,
      },
      {
        when: new Date(new Date().getTime() - 5000 * 60 * 60 * 24 * 7),
        address: "123456",
        amount: 1,
      },
      {
        when: new Date(new Date().getTime() - 10000 * 60 * 60 * 24 * 7),
        address: "3",
        amount: 1,
      },
    ],
  },
  {
    ...placeholderCampaignFields,

    address: "0xjunocontract2",
    name: "HouseDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",

    goal: 1000000,
    pledged: 700000,
    supporters: 7,
    supply: 1000000,

    activity: [],
  },
  {
    ...placeholderCampaignFields,

    address: "0xjunocontract3",
    name: "RentDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",

    goal: 500000,
    pledged: 200000,
    supporters: 200,
    supply: 1000000,

    activity: [],
  },
  {
    ...placeholderCampaignFields,

    address: "0xjunocontract4",
    name: "GroceryDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",

    goal: 1000000,
    pledged: 900000,
    supporters: 45,
    supply: 1000000,

    activity: [],
  },
  {
    ...placeholderCampaignFields,

    address: "0xjunocontract5",
    name: "MicroGridDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",

    goal: 1000000,
    pledged: 120000000000,
    supporters: 8,
    supply: 1200000,

    activity: [],
  },
]
