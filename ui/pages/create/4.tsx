import type { NextPage } from "next"
import { useState } from "react"
import { Controller, useFieldArray } from "react-hook-form"

import {
  CenteredColumn,
  ControlledFormPercentTokenDoubleInput,
  FormInput,
  FormSwitch,
  FormWrapper,
  InitialDistributionCreator,
  InitialDistributionDisplay,
  ResponsiveDecoration,
  VisibilityToggle,
} from "../../components"
import { useNewCampaignForm } from "../../helpers/form"
import { prettyPrintDecimal } from "../../helpers/number"
import { newCampaignFields } from "../../services/campaigns"

const Create4: NextPage = () => {
  const {
    formOnSubmit,
    register,
    errors,
    getValues,
    watch,
    control,
    Navigation,
  } = useNewCampaignForm(4)
  const {
    fields: initialDistributionsFields,
    append: initialDistributionsAppend,
    remove: initialDistributionsRemove,
    update: initialDistributionsUpdate,
  } = useFieldArray({
    control,
    name: "initialDistributions",
  })

  const [showingAdvanced, setShowingAdvanced] = useState(false)

  const watchTokenSymbol = watch("tokenSymbol")?.trim() || "tokens"

  const watchInitialSupply = watch("initialSupply") ?? 0

  // Validate that token amounts are all valid.
  const watchInitialDAOAmount = watch("initialDAOAmount") ?? 0
  const watchInitialDistributions = watch("initialDistributions") ?? []

  // Sum up amounts.
  const initialDistributionsAmount = watchInitialDistributions.reduce(
    (acc, { amount }) => acc + amount,
    0
  )
  const totalDistributionAmount =
    watchInitialDAOAmount + initialDistributionsAmount

  const goal = getValues("goal") ?? 0
  const tokenPrice =
    !isNaN(goal) && !isNaN(watchInitialSupply) && goal > 0
      ? watchInitialSupply / goal
      : undefined

  return (
    <>
      <ResponsiveDecoration
        name="campaigns_orange_blur.png"
        width={406}
        height={626}
        className="top-0 right-0 opacity-70"
      />

      <CenteredColumn className="py-10 max-w-4xl">
        <form className="flex flex-col" onSubmit={formOnSubmit}>
          <h1 className="font-semibold text-4xl mb-10">Token Configuration</h1>

          <div className="flex flex-col sm:flex-row sm:justify-between">
            <FormInput
              label={newCampaignFields.tokenName.label}
              placeholder="Name"
              type="text"
              wrapperClassName="w-full sm:w-2/3"
              error={errors.tokenName?.message}
              {...register("tokenName", {
                required: "Required",
                pattern: /\S/,
              })}
            />

            <FormInput
              label={newCampaignFields.tokenSymbol.label}
              placeholder="ABC"
              type="text"
              wrapperClassName="w-full sm:w-1/4"
              error={errors.tokenSymbol?.message}
              {...register("tokenSymbol", {
                required: "Required",
                pattern: /\S/,
              })}
            />
          </div>

          <FormInput
            label={newCampaignFields.passingThreshold.label}
            description="The proportion of votes needed for a proposal to pass."
            placeholder="75"
            type="number"
            inputMode="decimal"
            className="!pr-28"
            tail="%"
            error={errors.passingThreshold?.message}
            {...register("passingThreshold", {
              required: "Required",
              valueAsNumber: true,
              pattern: /^\s*\d+\s*$/,
              min: {
                value: 0,
                message: "Must be greater than 0.",
              },
              max: {
                value: 100,
                message: "Must be less than or equal to 100.",
              },
            })}
          />

          <VisibilityToggle
            visible={showingAdvanced}
            showLabel="Show Advanced Settings"
            hideLabel="Hide Advanced Settings"
            onClick={() => setShowingAdvanced((a) => !a)}
            toggleClassName="mb-10"
          >
            <FormInput
              label={newCampaignFields.initialSupply.label}
              description={`The amount of tokens to create initially. Divide this value by your funding target${
                typeof goal !== "undefined"
                  ? ` ($${prettyPrintDecimal(goal, 2, 2)} USD)`
                  : ""
              } to get the value of each token. Default is 10 million.`}
              accent={
                tokenPrice
                  ? `1 ${
                      watchTokenSymbol === "tokens" ? "token" : watchTokenSymbol
                    } = $${prettyPrintDecimal(tokenPrice, 2, 2)} USD`
                  : undefined
              }
              placeholder="10,000,000"
              type="number"
              inputMode="numeric"
              className="!pr-40"
              tail={watchTokenSymbol}
              error={errors.initialSupply?.message}
              {...register("initialSupply", {
                required: "Required",
                valueAsNumber: true,
                pattern: /^\s*\d+\s*$/,
                min: {
                  value: 0,
                  message: "Must be greater than 0.",
                },
              })}
            />

            {/* TODO: Update this value when initialSupply changes? */}
            <ControlledFormPercentTokenDoubleInput
              control={control}
              name="initialDAOAmount"
              label={newCampaignFields.initialDAOAmount.label}
              description="The amount of tokens to be reserved in the DAO for future distribution. Only the distributed tokens count when voting on proposals, so it is good practice to reserve most tokens for the DAO at the beginning. Default is 9 million."
              maxValue={watchInitialSupply}
              currency={watchTokenSymbol}
              first={{ placeholder: "90" }}
              second={{
                placeholder: prettyPrintDecimal(watchInitialSupply * 0.9, 6),
              }}
            />

            <FormWrapper
              label={newCampaignFields.initialDistributions.label}
              description="Addresses to distribute tokens to upon creation of the campaign. These addresses will receive DAO tokens without contributing any money to the DAO."
            >
              {initialDistributionsFields.map(
                ({ id, ...initialDistribution }, index) => (
                  <InitialDistributionDisplay
                    key={id}
                    initialSupply={watchInitialSupply}
                    tokenSymbol={watchTokenSymbol}
                    initialDistribution={initialDistribution}
                    onRemove={() => initialDistributionsRemove(index)}
                  />
                )
              )}

              <InitialDistributionCreator
                initialSupply={watchInitialSupply}
                tokenSymbol={watchTokenSymbol}
                fields={initialDistributionsFields}
                append={initialDistributionsAppend}
                update={initialDistributionsUpdate}
              />
            </FormWrapper>

            <FormInput
              label={newCampaignFields.votingDuration.label}
              description="The duration which a proposal awaits voting before it is automatically closed and either passes or fails. Default is 1 week (604,800 seconds)."
              placeholder="604,800"
              type="number"
              inputMode="numeric"
              className="!pr-40"
              tail="seconds"
              error={errors.votingDuration?.message}
              {...register("votingDuration", {
                required: "Required",
                valueAsNumber: true,
                pattern: /^\s*\d+\s*$/,
                min: {
                  value: 1,
                  message: "Must be at least 1.",
                },
              })}
            />

            <FormInput
              label={newCampaignFields.unstakingDuration.label}
              description="The duration..."
              placeholder="0"
              type="number"
              inputMode="numeric"
              className="!pr-40"
              tail="seconds"
              error={errors.unstakingDuration?.message}
              {...register("unstakingDuration", {
                required: "Required",
                valueAsNumber: true,
                pattern: /^\s*\d+\s*$/,
                min: {
                  value: 0,
                  message: "Must be at least 0.",
                },
              })}
            />

            <FormInput
              label={newCampaignFields.proposalDeposit.label}
              description="The number of tokens that must be deposited when creating a proposal. Default is 0."
              placeholder="0"
              type="number"
              inputMode="numeric"
              className="!pr-40"
              tail={watchTokenSymbol}
              error={errors.proposalDeposit?.message}
              {...register("proposalDeposit", {
                required: "Required",
                valueAsNumber: true,
                pattern: /^\s*\d+\s*$/,
                min: {
                  value: 0,
                  message: "Must be at least 0.",
                },
              })}
            />

            <Controller
              control={control}
              name="refundProposalDeposits"
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <FormSwitch
                  label={newCampaignFields.refundProposalDeposits.label}
                  description="Whether or not to refund the tokens deposited when submitting a proposal back to the proposer after the proposal is voted on. Default is yes."
                  error={error?.message}
                  onClick={() => onChange(!value)}
                  on={!!value}
                />
              )}
            />
          </VisibilityToggle>

          {Navigation}
        </form>
      </CenteredColumn>
    </>
  )
}

export default Create4
