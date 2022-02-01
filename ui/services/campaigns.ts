export const newCampaignFields: Record<keyof NewCampaign, NewCampaignField> = {
  name: { label: "Campaign Name", pageId: 1, required: true, advanced: false },
  description: {
    label: "Campaign Description",
    pageId: 1,
    required: true,
    advanced: false,
  },
  goal: { label: "Funding Target", pageId: 1, required: true, advanced: false },
  displayPublicly: {
    label: "Show on public campaigns list",
    pageId: 1,
    required: false,
    advanced: false,
  },

  daoName: { label: "DAO Name", pageId: 2, required: true, advanced: false },
  daoDescription: {
    label: "DAO Description",
    pageId: 2,
    required: true,
    advanced: false,
  },

  website: { label: "Website", pageId: 3, required: false, advanced: false },
  twitter: { label: "Twitter", pageId: 3, required: false, advanced: false },
  discord: { label: "Discord", pageId: 3, required: false, advanced: false },
  imageUrl: { label: "Image URL", pageId: 3, required: false, advanced: false },

  tokenName: {
    label: "Token Name",
    pageId: 4,
    required: true,
    advanced: false,
  },
  tokenSymbol: {
    label: "Token Symbol",
    pageId: 4,
    required: true,
    advanced: false,
  },
  passingThreshold: {
    label: "DAO Proposal Passing Threshold",
    pageId: 4,
    required: true,
    advanced: false,
  },
  // advanced
  initialSupply: {
    label: "Initial Token Supply",
    pageId: 4,
    required: true,
    advanced: true,
  },
  initialDAOAmount: {
    label: "DAO Initial Amount",
    pageId: 4,
    required: true,
    advanced: true,
  },
  initialDistributions: {
    label: "Initial Distributions",
    pageId: 4,
    required: true,
    advanced: true,
  },
  votingDuration: {
    label: "Voting Duration",
    pageId: 4,
    required: true,
    advanced: true,
  },
  unstakingDuration: {
    label: "Unstaking Duration",
    pageId: 4,
    required: true,
    advanced: true,
  },
  proposalDeposit: {
    label: "Proposal Deposit",
    pageId: 4,
    required: true,
    advanced: true,
  },
  refundProposalDeposits: {
    label: "Refund Proposal Deposits",
    pageId: 4,
    required: true,
    advanced: true,
  },
}
export const newCampaignFieldEntries = Object.entries(newCampaignFields) as [
  keyof NewCampaign,
  NewCampaignField
][]

export const campaigns: Campaign[] = [
  {
    id: "1",
    name: "BongDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    open: true,
    daoUrl: "https://noahsaso.com",

    asset: "$JUNO",
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
        asset: "$JUNO",
      },
      {
        when: new Date(new Date().getTime() - 5000 * 60 * 60 * 24 * 7),
        address: "123456",
        amount: 1,
        asset: "$JUNO",
      },
      {
        when: new Date(new Date().getTime() - 10000 * 60 * 60 * 24 * 7),
        address: "3",
        amount: 1,
        asset: "$JUNO",
      },
    ],
  },
  {
    id: "2",
    name: "HouseDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    open: true,

    asset: "$JUNO",
    goal: 1000000,
    pledged: 700000,
    supporters: 7,
    supply: 1000000,

    activity: [],
  },
  {
    id: "3",
    name: "RentDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    open: true,

    asset: "$JUNO",
    goal: 500000,
    pledged: 200000,
    supporters: 200,
    supply: 1000000,

    activity: [],
  },
  {
    id: "4",
    name: "GroceryDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    open: false,

    asset: "$JUNO",
    goal: 1000000,
    pledged: 900000,
    supporters: 45,
    supply: 1000000,

    activity: [],
  },
  {
    id: "5",
    name: "MicroGridDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    open: true,

    asset: "$JUNO",
    goal: 1000000,
    pledged: 120000000000,
    supporters: 8,
    supply: 1200000,

    activity: [],
  },
]
