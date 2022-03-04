import { Primitive } from "@sentry/types"

declare global {
  // Iterates over union values and unions them.
  type ValuesOfUnion<T> = T extends T ? T[keyof T] : never

  interface ErrorTags extends Record<string, Primitive | undefined> {
    source: string
    campaign?: string
    wallet?: string
    token?: string
    amount?: number
  }
}

export enum Color {
  Green = "green",
  Orange = "orange",
  Light = "light",
  Placeholder = "placeholder",
}

export type ColorType = `${Color}`
