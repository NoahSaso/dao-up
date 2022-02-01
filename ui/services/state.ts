import { atom } from "recoil"

export const newCampaignState = atom({
  key: "newCampaignState",
  default: {
    displayPublicly: true,
    initialSupply: 10000000,
    daoInitialAmount: 9000000,
    passingThreshold: 75,
    votingDuration: 604800,
    proposalDeposit: 0,
    unstakingDuration: 0,
    refundProposalDeposits: true,
  } as NewCampaign,
})

export const walletState = atom({
  key: "walletState",
  default: {
    connected: false,
    address: "",
  } as WalletState,
})
