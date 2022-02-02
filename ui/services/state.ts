import { atom } from "recoil"

export const newCampaignState = atom({
  key: "newCampaignState",
  default: {
    displayPublicly: true,
    initialSupply: 10000000,
    initialDAOAmount: 0,
    initialDistributions: [],
    passingThreshold: 75,
    votingDuration: 604800,
    unstakingDuration: 0,
    proposalDeposit: 0,
    refundProposalDeposits: true,
  } as Partial<NewCampaign>,
})

export const walletState = atom({
  key: "walletState",
  default: {
    connected: false,
    address: "",
  } as WalletState,
})
