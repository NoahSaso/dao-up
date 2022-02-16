import { AtomEffect } from "recoil"

import { chainId } from "@/config"

export const localStorageEffect =
  <T>(
    key: string,
    serialize: (value: T) => string,
    parse: (saved: string) => T
  ): AtomEffect<T> =>
  ({ setSelf, onSet }) => {
    // Namespace localStorage keys to prevent collisions.
    const namespacedKey = `${chainId}:${key}`

    const savedValue = localStorage.getItem(namespacedKey)
    if (savedValue != null) setSelf(parse(savedValue))

    onSet((newValue: T, _: any, isReset: boolean) => {
      if (isReset) {
        localStorage.removeItem(namespacedKey)
      } else {
        localStorage.setItem(namespacedKey, serialize(newValue))
      }
    })
  }

export const localStorageEffectJSON = <T>(key: string): AtomEffect<T> =>
  localStorageEffect(key, JSON.stringify, JSON.parse)
