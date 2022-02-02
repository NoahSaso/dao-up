import cn from "classnames"
import { FC, useRef, useState } from "react"
import { FieldArrayMethodProps, FieldArrayWithId } from "react-hook-form"
import { IoCloseSharp } from "react-icons/io5"

import {
  validateAndCleanJunoAddress,
  validateInitialDistributionAmount,
} from "../helpers/form"
import { prettyPrintDecimal } from "../helpers/number"
import { Button, FormInput, FormPercentTokenDoubleInput } from "."

// Display

type InitialDistributionDisplayProps = {
  initialSupply: number
  tokenSymbol: string
  initialDistribution: InitialDistribution
  onRemove: () => void
}

export const InitialDistributionDisplay: FC<
  InitialDistributionDisplayProps
> = ({ initialSupply, tokenSymbol, initialDistribution, onRemove }) => (
  <div
    className={cn(
      "flex flex-row justify-between items-start",
      "border-b border-light",
      "p-5 pr-0 first:pt-0"
    )}
  >
    <div>
      <h3 className={cn("text-green text-lg")}>
        {initialDistribution.address}
      </h3>

      <p className={cn("text-light text-base")}>
        {`${
          initialSupply > 0
            ? prettyPrintDecimal(
                (100 * initialDistribution.amount) / initialSupply,
                6
              )
            : "0"
        }% of total tokens / `}
        {prettyPrintDecimal(initialDistribution.amount)} {tokenSymbol}
      </p>
    </div>

    <Button color="orange" onClick={onRemove} simple>
      <IoCloseSharp size={24} />
    </Button>
  </div>
)

type InitialDistributionCreatorProps = {
  initialSupply: number
  remainingSupply: number
  tokenSymbol: string
  fields: FieldArrayWithId<Partial<NewCampaign>, "initialDistributions", "id">[]
  append: (
    value: Partial<InitialDistribution> | Partial<InitialDistribution>[],
    options?: FieldArrayMethodProps | undefined
  ) => void
  update: (index: number, value: Partial<InitialDistribution>) => void
}

// Creator

export const InitialDistributionCreator: FC<
  InitialDistributionCreatorProps
> = ({
  initialSupply,
  remainingSupply,
  tokenSymbol,
  fields,
  append,
  update,
}) => {
  const [address, setAddress] = useState("")
  const [addressError, setAddressError] = useState("")
  const addressRef = useRef<HTMLInputElement>(null)

  const [amount, setAmount] = useState(0)
  const [amountError, setAmountError] = useState("")
  const amountRef = useRef<HTMLInputElement>(null)

  // Validate address and amount on the fly.
  const [cleanedAddress, addressValidationError] =
    validateAndCleanJunoAddress(address)

  // Find existing field.
  const existingIndex = fields?.findIndex(
    ({ address }) => address === cleanedAddress
  )
  const existingField =
    typeof existingIndex === "number" && existingIndex > -1
      ? fields[existingIndex]
      : undefined

  // If address already exists, ignore its set amount in the remaining supply since we're going to update it.
  const remainingSupplyExceptSelf =
    remainingSupply + (existingField?.amount ?? 0)
  const anyRemainingSupply = remainingSupplyExceptSelf > 0

  const addRecipient = () => {
    setAddressError("")
    setAmountError("")

    let valid = true

    if (addressValidationError) {
      addressRef?.current?.focus()
      valid = false
      setAddressError(addressValidationError)
    }

    // If address already exists, ignore the amount in the remaining supply since we're going to update it.
    if (!validateInitialDistributionAmount(amount, remainingSupplyExceptSelf)) {
      // If not yet invalid (thus hasn't focused address field due to error), focus this field.
      if (valid) amountRef?.current?.focus()
      valid = false

      const percentRemaining = prettyPrintDecimal(
        (100 * remainingSupplyExceptSelf) / initialSupply,
        6
      )
      setAmountError(
        anyRemainingSupply
          ? `Must be greater than 0% (0 ${tokenSymbol}) and less than or equal to the remaining ${percentRemaining}% (${prettyPrintDecimal(
              remainingSupplyExceptSelf
            )} ${tokenSymbol})${
              !!existingField
                ? " since you're updating an existing address"
                : ""
            }.`
          : "All tokens have been allotted to the DAO or other Initial Distribution Addresses. Increase the Initial Token Supply, or decrease the DAO Initial Amount or Initial Distribution Amounts above before adding another address."
      )
    }

    if (!valid) return

    const newInitialDistribution = { address: cleanedAddress, amount }

    // If duplicate address, update instead of append.
    if (existingField) update?.(existingIndex, newInitialDistribution)
    else append?.(newInitialDistribution)

    // Clear state on add.
    setAddress("")
    setAmount(0)
  }

  return (
    <div
      className={cn(
        "flex flex-col justify-start items-stretch",
        "p-5 pr-0 first:pt-0"
      )}
    >
      <FormInput
        label="Initial Distribution Address"
        placeholder="juno..."
        type="text"
        wrapperClassName="!mb-6"
        value={address}
        onInput={(e) => setAddress(e.currentTarget.value)}
        error={addressError}
        ref={addressRef}
      />

      <FormPercentTokenDoubleInput
        label="Initial Distribution Amount"
        maxValue={initialSupply}
        currency={tokenSymbol}
        shared={{ placeholder: "0" }}
        value={amount}
        onChangeAmount={(value) => setAmount(value)}
        wrapperClassName="mb-6"
        error={amountError}
        ref={amountRef}
      />

      <Button
        onClick={addRecipient}
        className="self-start"
        disabled={!anyRemainingSupply}
      >
        {existingField ? "Update" : "Add"} Recipient
      </Button>

      {!anyRemainingSupply && (
        <p className="text-green mt-4">
          All tokens have been allotted to the DAO or other Initial Distribution
          Addresses. Increase the Initial Token Supply, or decrease the DAO
          Initial Amount or Initial Distribution Amounts above before adding
          another address.
        </p>
      )}
    </div>
  )
}
