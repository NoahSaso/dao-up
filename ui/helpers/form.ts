import { chainPrefix } from "@/config"

export const walletAddressPattern = {
  value: new RegExp(`^${chainPrefix}[a-km-zA-HJ-NP-Z0-9]{39}$`, "i"),
  message: "Invalid wallet address.",
}

export const daoAddressPattern = {
  value: new RegExp(`^${chainPrefix}[a-km-zA-HJ-NP-Z0-9]{59}$`, "i"),
  message: "Invalid DAO address.",
}

export const urlPattern = {
  value: /^https?:\/\/.+$/,
  message: "Invalid URL. Ensure it starts with 'http://' or 'https://'.",
}

export const numberPattern = {
  value: /^\s*[0-9,.]+\s*$/,
  message: "Invalid number.",
}
