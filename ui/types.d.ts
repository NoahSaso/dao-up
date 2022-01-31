interface ActivityItem {
  when: Date
  address: string
  amount: number
  asset: string
}

interface Campaign {
  id: string
  name: string
  description: string
  imageUrl?: string
  open: boolean
  daoUrl?: string

  website?: string
  twitter?: string
  discord?: string

  asset: string
  goal: number
  pledged: number
  supporters: number
  supply: number

  activity: ActivityItem[]
}

interface NewCampaign {
  name: string
  goal: number
  description: string
  displayPublicly: boolean

  daoName: string
  daoDescription: string

  website?: string
  twitter?: string
  discord?: string
  imageUrl?: string

  tokenName: string
  tokenSymbol: string
  initialSupply: number
  daoInitialAmount: number

  creatorAddress: string
  creatorInitialAmount: number

  passingThreshold: number
  votingDuration: number
  proposalDeposit: number
  unstakingDuration: number
  refundProposalDeposits: boolean
}
