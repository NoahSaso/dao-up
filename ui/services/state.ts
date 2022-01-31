import { atom } from "recoil"

export const newCampaignState = atom({
  key: "newCampaignState",
  default: {} as NewCampaign,
})
