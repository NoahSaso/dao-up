import { chainPrefix } from "@/config"

export const walletAddressPattern = {
  value: new RegExp(`^${chainPrefix}[a-km-zA-HJ-NP-Z0-9]{39}$`, "i"),
  message: "Invalid wallet address.",
}

export const daoAddressPattern = {
  value: new RegExp(`^${chainPrefix}[a-km-zA-HJ-NP-Z0-9]{59}$`, "i"),
  message: "Invalid DAO address.",
}

export const escrowAddressRegex = daoAddressPattern.value

export const urlPattern = {
  value: /^https?:\/\/.+$/,
  message: "Invalid URL. Ensure it starts with 'http://' or 'https://'.",
}

export const nonSVGImagePattern = {
  value: /^https?:\/\/.+(?<!\.svg)$/,
  message:
    "Invalid image URL. Ensure it starts with 'http://' or 'https://' and is not an SVG.",
}

export const numberPattern = {
  value: /^\s*[0-9,.]+\s*$/,
  message: "Invalid number.",
}

export const tokenSymbolPattern = {
  value: /^\s*[a-zA-Z-]{3,12}\s*$/,
  message: "Must be between 3 and 12 alphabetical characters.",
}
