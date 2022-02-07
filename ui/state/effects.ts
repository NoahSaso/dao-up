import { AtomEffect } from "recoil"

export const localStorageEffect =
  <T>(
    key: string,
    serialize: (value: T) => string,
    parse: (saved: string) => T
  ): AtomEffect<T> =>
  ({ setSelf, onSet }) => {
    const savedValue = localStorage.getItem(key)
    if (savedValue != null) setSelf(parse(savedValue))

    onSet((newValue: T, _: any, isReset: boolean) => {
      if (isReset) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, serialize(newValue))
      }
    })
  }

export const localStorageEffectJSON = <T>(key: string): AtomEffect<T> =>
  localStorageEffect(key, JSON.stringify, JSON.parse)
