import cn from "classnames"
import type { NextPage } from "next"
import { useState } from "react"
import { Controller } from "react-hook-form"

import {
  Button,
  CenteredColumn,
  FormInput,
  FormSwitch,
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
  const [showingAdvanced, setShowingAdvanced] = useState(false)

  const goal = getValues("goal") ?? 0
  const watchTokenSymbol = watch("tokenSymbol")?.trim() || "tokens"
  const watchInitialSupply = watch("initialSupply") ?? 0
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
            tail={
              <div className="h-full px-6 rounded-full bg-light flex items-center text-center text-dark">
                %
              </div>
            }
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
                typeof goal !== "undefined" ? ` (${goal.toLocaleString()})` : ""
              } to get the value of each token. Default is 10 million.`}
              accent={
                tokenPrice
                  ? `1 token = ${prettyPrintDecimal(tokenPrice, 2, 2)} USD`
                  : undefined
              }
              placeholder="10,000,000"
              type="number"
              inputMode="numeric"
              className="!pr-40"
              tail={
                <div className="h-full px-6 rounded-full bg-light flex items-center text-center text-dark">
                  {watchTokenSymbol}
                </div>
              }
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

            <FormInput
              label={newCampaignFields.initialDAOAmount.label}
              description="The amount of tokens to be reserved in the DAO for future distribution. Only the distributed tokens count when voting on proposals, so it is good practice to reserve most tokens for the DAO at the beginning. Default is 9 million."
              placeholder="9,000,000"
              type="number"
              inputMode="numeric"
              className="!pr-40"
              tail={
                <div className="h-full px-6 rounded-full bg-light flex items-center text-center text-dark">
                  {watchTokenSymbol}
                </div>
              }
              error={errors.initialDAOAmount?.message}
              {...register("initialDAOAmount", {
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
              label={newCampaignFields.initialDistributionAddress.label}
              description="An address to send tokens to upon creation of the campaign. This address will receive DAO tokens without contributing any money to the DAO."
              placeholder="juno..."
              type="text"
              error={errors.initialDistributionAddress?.message}
              {...register("initialDistributionAddress", {
                // TODO: address format
                pattern: /^\s*juno.+\s*$/,
              })}
            />

            <FormInput
              label={newCampaignFields.initialDistributionAmount.label}
              description="The amount of tokens to be sent to the initial distribution address. The initial distribution address will receive DAO tokens without contributing any money to the DAO. Default is 0."
              placeholder="0"
              type="number"
              inputMode="numeric"
              className="!pr-40"
              error={errors.initialDistributionAmount?.message}
              {...register("initialDistributionAmount", {
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
              label={newCampaignFields.votingDuration.label}
              description="The duration which a proposal awaits voting before it is automatically closed and either passes or fails. Default is 1 week (604,800 seconds)."
              placeholder="604,800"
              type="number"
              inputMode="numeric"
              className="!pr-40"
              tail={
                <div className="h-full px-6 rounded-full bg-light flex items-center text-center text-dark">
                  seconds
                </div>
              }
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
              tail={
                <div className="h-full px-6 rounded-full bg-light flex items-center text-center text-dark">
                  seconds
                </div>
              }
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
              tail={
                <div className="h-full px-6 rounded-full bg-light flex items-center text-center text-dark">
                  {watchTokenSymbol}
                </div>
              }
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
