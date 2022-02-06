export const junoAddressPattern = {
  // TODO: get real juno regex
  value: /^juno.+$/,
  message: "Invalid Juno address. Ensure it starts with 'juno'.",
}

export const urlPattern = {
  value: /^https?:\/\/.+$/,
  message: "Invalid URL. Ensure it starts with 'http://' or 'https://'.",
}

export const numberPattern = {
  value: /^\s*[0-9,.]+\s*$/,
  message: "Invalid number.",
}
