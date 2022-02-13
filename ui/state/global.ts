import { atom } from "recoil"

import { localStorageEffectJSON } from "./effects"

export const globalLoadingAtom = atom({
  key: "globalLoading",
  default: false,
})

const betaAlertAcceptedKey = "betaAlertAccepted"
export const betaAlertAcceptedAtom = atom({
  key: betaAlertAcceptedKey,
  default: false,
  effects: [localStorageEffectJSON(betaAlertAcceptedKey)],
})
