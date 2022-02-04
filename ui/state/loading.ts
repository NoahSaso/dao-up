import { atom } from "recoil"

export const globalLoadingAtom = atom({
  key: "globalLoading",
  default: false,
})
