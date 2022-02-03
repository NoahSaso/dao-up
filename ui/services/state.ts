import { atom } from "recoil"

export const walletState = atom({
  key: "walletState",
  default: {
    connected: false,
    address: "",
  } as WalletState,
})
