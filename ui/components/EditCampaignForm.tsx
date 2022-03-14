import cn from "classnames"
import {
  FunctionComponent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import {
  Controller,
  FormState,
  SubmitHandler,
  useFieldArray,
  useForm,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form"
import {
  IoAdd,
  IoCaretDown,
  IoCheckmark,
  IoEye,
  IoEyeOff,
  IoWarning,
} from "react-icons/io5"
import { useRecoilValueLoadable, useSetRecoilState } from "recoil"

import {
  Button,
  CampaignDetails,
  FormInput,
  FormSwitch,
  FormTextArea,
  FormWrapper,
  ImageUrlField,
  Loader,
} from "@/components"
import { daoUpFeeNum, publicPaymentFeeMicroNum } from "@/config"
import {
  convertMicroDenomToDenom,
  daoAddressPattern,
  getScrollableParent,
  numberPattern,
  prettyPrintDecimal,
  tokenSymbolPattern,
  urlPattern,
} from "@/helpers"
import { useRefCallback, useWallet } from "@/hooks"
import { baseToken, getNextPayTokenDenom, getPayTokenLabel } from "@/services"
import { globalLoadingAtom, validateDAO } from "@/state"

const validUrlOrUndefined = (u: string | undefined) =>
  u && u.match(urlPattern.value) ? u : undefined

type FormValues<T extends boolean = boolean> = T extends true
  ? NewCampaignInfo
  : UpdateCampaignInfo
type OnSubmitForm<T extends boolean> = SubmitHandler<FormValues<T>>

type EditCampaignFormProps = {
  title?: ReactNode
  submitLabel: string
  error?: ReactNode | null
} & (
  | {
      creating: true
      defaultValues: Partial<FormValues<true>>
      onSubmit: OnSubmitForm<true>
    }
  | {
      creating: false
      defaultValues: Partial<FormValues<false>>
      onSubmit: OnSubmitForm<false>
    }
)

export const EditCampaignForm: FunctionComponent<EditCampaignFormProps> = ({
  title,
  submitLabel,
  error,
  defaultValues,
  ...props
}) => {
  const { connect, connected, connectError } = useWallet()
  const setLoading = useSetRecoilState(globalLoadingAtom)
  const [pendingSubmission, setPendingSubmission] = useState(
    null as FormValues | null
  )

  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<FormValues>({ defaultValues })

  // descriptionImageUrls list
  const {
    fields: descriptionImageUrlsFields,
    append: descriptionImageUrlsAppend,
    remove: descriptionImageUrlsRemove,
    move: descriptionImageUrlsMove,
  } = useFieldArray({
    control,
    name: "_descriptionImageUrls",
  })
  // New Description Image URL
  const [newDescriptionImageUrl, setNewDescriptionImageUrl] = useState("")
  const [newDescriptionImageUrlError, setNewDescriptionImageUrlError] =
    useState("")
  const newDescriptionImageUrlRef = useRef<HTMLInputElement>(null)
  const addNewDescriptionImageUrl = () => {
    if (newDescriptionImageUrl.match(urlPattern.value)) {
      descriptionImageUrlsAppend({ url: newDescriptionImageUrl })
      setNewDescriptionImageUrl("")
      setNewDescriptionImageUrlError("")
    } else {
      setNewDescriptionImageUrlError(urlPattern.message)
    }

    // Just pressed add button, refocus on input.
    newDescriptionImageUrlRef.current?.focus()
  }

  // Information for displaying campaign preview.
  const campaignName = watch("name")
  const campaignDescription = watch("description")
  const campaignWebsite = validUrlOrUndefined(watch("website"))
  const campaignDiscord = validUrlOrUndefined(watch("discord"))
  const campaignTwitter = watch("twitter")
  const campaignProfileImageUrl = validUrlOrUndefined(watch("profileImageUrl"))
  const campaign_DescriptionImageUrls = watch("_descriptionImageUrls")

  const [showCampaignDescriptionPreview, setShowCampaignDescriptionPreview] =
    useState(false)

  const [formScrollableParent, setFormScrollableParent] = useState<
    HTMLElement | Window
  >(window)
  const formRef = useRef<HTMLFormElement | null>(null)
  const { setRef: setFormRef } = useRefCallback<HTMLFormElement>(
    formRef,
    (ref) => setFormScrollableParent(getScrollableParent(ref))
  )

  // Scroll to bottom of page when error is displayed.
  useEffect(() => {
    if (error || connectError) {
      // Get first scrollable parent of form.
      formScrollableParent.scrollTo({
        left: 0,
        top: document.body.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [formScrollableParent, error, connectError])

  const _onSubmit: SubmitHandler<FormValues> = useCallback(
    async (values) => {
      // Connect to wallet if necessary.
      if (!connected) {
        setPendingSubmission(values)
        await connect()
        return
      }

      setLoading(true)

      // Clean values.
      values.name = values.name.trim()
      values.description = values.description.trim()
      // Transform _descriptionImageUrls objects into strings.
      values.descriptionImageUrls =
        values._descriptionImageUrls?.map(({ url }) => url) ?? []
      delete values._descriptionImageUrls

      // Clean creation-specific values.
      if (props.creating) {
        const newCampaignValues = values as NewCampaignInfo
        newCampaignValues.tokenName = newCampaignValues.tokenName.trim()
        newCampaignValues.tokenSymbol = newCampaignValues.tokenSymbol.trim()
      }

      // Submit.
      await (props.onSubmit as OnSubmitForm<typeof props.creating>)(values)

      setLoading(false)
    },
    [connected, setLoading, connect, setPendingSubmission, props]
  )

  // Submit pending submission after connection succeeds.
  useEffect(() => {
    if (connected && pendingSubmission) {
      _onSubmit(pendingSubmission)
      setPendingSubmission(null)
    }
  }, [connected, pendingSubmission, setPendingSubmission, _onSubmit])

  return (
    <DndProvider backend={HTML5Backend}>
      <form
        className="flex flex-col w-full"
        onSubmit={handleSubmit(_onSubmit)}
        ref={setFormRef}
      >
        <div className="flex flex-row justify-between items-center flex-wrap gap-4 mb-8">
          {title}

          <Button
            outline
            color="light"
            onClick={() => setShowCampaignDescriptionPreview((b) => !b)}
          >
            <div className="flex items-center gap-2">
              {showCampaignDescriptionPreview ? (
                <IoEyeOff size={20} />
              ) : (
                <IoEye size={20} />
              )}
              Preview
            </div>
          </Button>
        </div>

        {showCampaignDescriptionPreview ? (
          <div className="w-full self-center mb-8 border border-light p-8 rounded-3xl">
            <CampaignDetails
              name={campaignName || "Your campaign"}
              description={campaignDescription || "Your campaign description"}
              website={campaignWebsite}
              twitter={campaignTwitter}
              discord={campaignDiscord}
              profileImageUrl={campaignProfileImageUrl}
              descriptionImageUrls={campaign_DescriptionImageUrls?.map(
                ({ url }) => url
              )}
            />
          </div>
        ) : (
          <>
            <div className="lg:mx-2">
              <FormInput
                label="Name"
                placeholder="Name"
                type="text"
                error={errors.name?.message}
                {...register("name", {
                  required: "Required",
                  pattern: {
                    value: /\S/,
                    message: "Invalid name.",
                  },
                })}
              />

              <FormTextArea
                label="Description"
                placeholder="Describe what your campaign is about (supports markdown)..."
                rows={8}
                error={errors.description?.message}
                {...register("description", {
                  required: "Required",
                  pattern: {
                    value: /\S/,
                    message: "Invalid description.",
                  },
                })}
              />

              <FormInput
                label="Profile Image URL"
                placeholder="https://your.campaign/logo.png"
                type="url"
                spellCheck={false}
                autoCorrect="off"
                error={errors.profileImageUrl?.message}
                // Warn user that SVGs will not be supported in link previews.
                accent={
                  campaignProfileImageUrl?.endsWith(".svg")
                    ? "SVG images will not show up in link previews. We recommend using a JPG or PNG instead."
                    : undefined
                }
                {...register("profileImageUrl", {
                  required: false,
                  pattern: urlPattern,
                })}
              />

              <FormWrapper label="Description Image URLs">
                {/* Add new description image URL. */}
                <FormInput
                  placeholder="https://your.campaign/campaign-1.png"
                  type="url"
                  spellCheck={false}
                  autoCorrect="off"
                  error={newDescriptionImageUrlError}
                  value={newDescriptionImageUrl}
                  onInput={(e) => {
                    setNewDescriptionImageUrl(e.currentTarget.value)
                    newDescriptionImageUrlError &&
                      setNewDescriptionImageUrlError("")
                  }}
                  // Add image on enter key press.
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addNewDescriptionImageUrl()
                      e.preventDefault()
                    }
                  }}
                  wrapperClassName={cn({
                    "!mb-0": descriptionImageUrlsFields.length === 0,
                    "!mb-2": descriptionImageUrlsFields.length > 0,
                  })}
                  ref={newDescriptionImageUrlRef}
                >
                  <Button
                    outline
                    color="green"
                    type="button"
                    onClick={addNewDescriptionImageUrl}
                  >
                    <IoAdd size={24} />
                  </Button>
                </FormInput>

                {descriptionImageUrlsFields.map((field, index) => (
                  <ImageUrlField
                    key={field.id}
                    index={index}
                    field={field}
                    remove={() => descriptionImageUrlsRemove(index)}
                    move={(from, to) => descriptionImageUrlsMove(from, to)}
                  />
                ))}
              </FormWrapper>
            </div>

            <h2 className="font-semibold text-2xl mb-8">Community Platforms</h2>

            <div className="lg:mx-2">
              <FormInput
                label="Website"
                placeholder="https://your.campaign"
                type="url"
                spellCheck={false}
                autoCorrect="off"
                error={errors.website?.message}
                {...register("website", {
                  required: false,
                  pattern: urlPattern,
                })}
              />

              <FormInput
                label="Twitter"
                placeholder="@CampaignDAO"
                type="text"
                error={errors.twitter?.message}
                {...register("twitter", {
                  required: false,
                  pattern: {
                    value: /^@.+$/,
                    message:
                      "Invalid Twitter handle. Ensure it starts with '@'.",
                  },
                })}
              />

              <FormInput
                label="Discord"
                placeholder="https://discord.gg/campaign"
                type="url"
                spellCheck={false}
                autoCorrect="off"
                error={errors.discord?.message}
                {...register("discord", {
                  required: false,
                  pattern: {
                    value: /^https:\/\/discord\.gg\/.+$/,
                    message:
                      "Invalid Discord invite. Ensure it starts with 'https://discord.gg/'",
                  },
                })}
              />
            </div>
          </>
        )}

        {props.creating && (
          <FundingDetailsContent
            watch={watch as UseFormWatch<FormValues<typeof props.creating>>}
            errors={
              errors as FormState<FormValues<typeof props.creating>>["errors"]
            }
            setValue={
              setValue as UseFormSetValue<FormValues<typeof props.creating>>
            }
            register={
              register as UseFormRegister<FormValues<typeof props.creating>>
            }
          />
        )}

        <div className="lg:mx-2">
          <Controller
            control={control}
            name="hidden"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormSwitch
                label="Display in public campaigns list"
                description={`Costs ${prettyPrintDecimal(
                  convertMicroDenomToDenom(
                    publicPaymentFeeMicroNum,
                    baseToken.decimals
                  )
                )} ${baseToken.symbol} to prevent spam.${
                  !props.creating
                    ? " Fee will be charged to the DAO once the proposal executes."
                    : ""
                }`}
                error={error?.message}
                onClick={() => onChange(!value)}
                on={!value}
              />
            )}
          />
        </div>

        {!!(error || connectError) && (
          <p className="text-orange mb-4 self-end max-w-lg">
            {error ?? connectError}
          </p>
        )}

        <Button submitLabel={submitLabel} className="self-end" />
      </form>
    </DndProvider>
  )
}

// Only shown when creating a new campaign.

interface FundingDetailsContentProps {
  watch: UseFormWatch<NewCampaignInfo>
  errors: FormState<NewCampaignInfo>["errors"]
  setValue: UseFormSetValue<NewCampaignInfo>
  register: UseFormRegister<NewCampaignInfo>
}

const FundingDetailsContent: FunctionComponent<FundingDetailsContentProps> = ({
  watch,
  errors,
  setValue,
  register,
}) => {
  // Automatically verify DAO contract address exists on chain.
  const watchDAOAddress = watch("daoAddress")
  const daoAddressFormatValid = !!watchDAOAddress?.match(
    daoAddressPattern.value
  )?.length
  const {
    state: daoValidateState,
    contents: { valid: daoValid, error: daoValidateError },
  } = useRecoilValueLoadable(
    // Only attempt to validate DAO address once it matches the regex.
    validateDAO(daoAddressFormatValid ? watchDAOAddress : undefined)
  )
  const checkingDAO = daoValidateState === "loading"
  const validDAO = daoValidateState === "hasValue" && !!daoValid
  // Only invalid if pattern matches AND has determined invalid address.
  const invalidDAO = daoAddressFormatValid && !validDAO

  // Compute relevant goal fee amounts.
  const watchGoal = watch("goal") ?? 0
  const goalReceived = watchGoal ? watchGoal * (1 - daoUpFeeNum) : undefined
  const raiseToGoal = watchGoal
    ? Math.ceil(watchGoal / (1 - daoUpFeeNum))
    : undefined

  // Pay token.
  const watchPayTokenDenom = watch("payTokenDenom")
  const watchPayTokenLabel = getPayTokenLabel(watchPayTokenDenom)

  return (
    <>
      <h2 className="font-semibold text-2xl mb-8">Funding Details</h2>

      <div className="lg:mx-2">
        <FormInput
          label="Funding Target"
          placeholder="10,000"
          type="number"
          inputMode="decimal"
          className="!pr-28"
          // Move padding to button so the whole tail is clickable.
          tailClassName="!p-0 bg-light/70"
          tail={
            <Button
              onClick={() =>
                setValue(
                  "payTokenDenom",
                  getNextPayTokenDenom(watchPayTokenDenom)
                )
              }
              color="light"
              className="h-full px-6 !border-none !text-dark flex flex-row items-center gap-2"
            >
              {watchPayTokenLabel}
              <IoCaretDown size={18} />
            </Button>
          }
          error={errors.goal?.message}
          accent={
            goalReceived && raiseToGoal ? (
              <>
                DAO Up! will take a 3% cut and you&apos;ll receive{" "}
                <span className="text-light">
                  {prettyPrintDecimal(goalReceived)} {watchPayTokenLabel}
                </span>
                .{" "}
                <Button
                  bare
                  className="inline underline"
                  onClick={() => setValue("goal", raiseToGoal)}
                >
                  Raise {prettyPrintDecimal(raiseToGoal)} {watchPayTokenLabel}
                </Button>{" "}
                to receive {prettyPrintDecimal(watchGoal)} {watchPayTokenLabel}.
              </>
            ) : undefined
          }
          {...register("goal", {
            required: "Required",
            valueAsNumber: true,
            pattern: numberPattern,
            min: {
              value: convertMicroDenomToDenom(1, 6),
              message: "Must be at least 0.000001.",
            },
          })}
        />

        <FormInput
          label="DAO Address"
          placeholder="juno..."
          type="text"
          error={
            (daoAddressFormatValid ? daoValidateError : null) ??
            errors.daoAddress?.message
          }
          tail={
            checkingDAO ? (
              <Loader size={28} />
            ) : validDAO ? (
              <IoCheckmark size={28} className="text-green" />
            ) : invalidDAO ? (
              <IoWarning size={28} className="text-orange" />
            ) : undefined
          }
          tailClassName="!bg-dark"
          className="!pr-24"
          {...register("daoAddress", {
            required: "Required",
            pattern: daoAddressPattern,
            validate: () => validDAO,
          })}
        />

        <FormInput
          label="Campaign Token Name"
          description="The name of the tokens backers will receive for their contributions. These become exchangeable for the DAO's governance tokens when funding succeeds."
          placeholder="Funding Token"
          type="text"
          error={errors.tokenName?.message}
          {...register("tokenName", {
            required: "Required",
            pattern: {
              value: /\S/,
              message: "Invalid token name.",
            },
          })}
        />

        <FormInput
          label="Campaign Token Symbol"
          placeholder="TOKEN"
          type="text"
          error={errors.tokenSymbol?.message}
          {...register("tokenSymbol", {
            required: "Required",
            pattern: tokenSymbolPattern,
            minLength: {
              value: 3,
              message: "Must be at least 3 characters.",
            },
            maxLength: {
              value: 12,
              message: "Must be 12 or fewer characters.",
            },
          })}
        />
      </div>
    </>
  )
}
