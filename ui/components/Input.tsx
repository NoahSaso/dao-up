import cn from "classnames"
import {
  DetailedHTMLProps,
  FC,
  forwardRef,
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode,
  TextareaHTMLAttributes,
  useRef,
  useState,
} from "react"
import {
  Control,
  Controller,
  FieldArrayMethodProps,
  FieldArrayWithId,
  FieldValues,
} from "react-hook-form"
import { IoCaretDownSharp, IoCloseSharp } from "react-icons/io5"

import {
  validateAndCleanJunoAddress,
  validateInitialDistributionAmount,
} from "../helpers/form"
import { prettyPrintDecimal } from "../helpers/number"
import { Button } from "."

// Input

interface UnforwardedInputProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  containerClassName?: string
  tail?: ReactNode
  tailContainerClassName?: string
  tailClassName?: string
}
export const Input = forwardRef<HTMLInputElement, UnforwardedInputProps>(
  (
    {
      containerClassName,
      className,
      tail,
      tailContainerClassName,
      tailClassName,
      ...props
    },
    ref
  ) => (
    <div className={cn("relative", containerClassName)}>
      <input
        className={cn(
          "bg-card placeholder:text-placeholder",
          "py-3 px-7 w-full",
          "rounded-full",
          "border border-card focus:outline-none focus:border-green",
          "transition",
          className
        )}
        {...props}
        ref={ref}
      />
      {!!tail && (
        <div
          className={cn(
            "absolute top-0 right-0 bottom-0 rounded-full",
            tailContainerClassName
          )}
        >
          <div
            className={cn(
              "h-full px-6 rounded-full bg-light flex items-center text-center text-dark",
              tailClassName
            )}
          >
            {tail}
          </div>
        </div>
      )}
    </div>
  )
)
Input.displayName = "Input"

type UnforwardedDoubleInputProps = {
  containerClassName?: string
  shared?: UnforwardedInputProps
  first?: UnforwardedInputProps
  second?: UnforwardedInputProps
  swap?: boolean
}

enum SwapDoubleInputId {
  First,
  Second,
}

export const DoubleInput = forwardRef<
  HTMLInputElement,
  UnforwardedDoubleInputProps
>(
  (
    {
      containerClassName,
      shared: {
        containerClassName: sharedContainerClassName,
        className: sharedClassName,
        ...shared
      } = {},
      first: {
        containerClassName: firstContainerClassName,
        className: firstClassName,
        ...first
      } = {},
      second: {
        containerClassName: secondContainerClassName,
        className: secondClassName,
        ...second
      } = {},
      swap = true,
    },
    ref
  ) => {
    // Which input to show when swapping.
    // Initially show the first input if swapping.
    const [swapInputShowing, showSwapInput] = useState(
      swap ? SwapDoubleInputId.First : undefined
    )

    const getSwapProps = (
      tailContent: ReactNode | undefined,
      currentSwapInputShowing: SwapDoubleInputId
    ) => ({
      // Move padding to button so the whole tail is clickable.
      tailClassName: "!p-0 bg-light/70",
      tail: (
        <Button
          onClick={() =>
            showSwapInput(
              currentSwapInputShowing === SwapDoubleInputId.First
                ? SwapDoubleInputId.Second
                : SwapDoubleInputId.First
            )
          }
          color="light"
          className="h-full px-6 !border-none !text-dark flex flex-row items-center"
        >
          {tailContent ?? shared.tail}
          <IoCaretDownSharp size={18} className="ml-2" />
        </Button>
      ),
    })

    return (
      <div
        className={cn(
          "flex flex-col items-stretch sm:flex-row",
          containerClassName
        )}
      >
        <Input
          containerClassName={cn(
            "flex-1",
            { hidden: swapInputShowing === SwapDoubleInputId.Second },
            sharedContainerClassName,
            firstContainerClassName
          )}
          className={cn(
            "!bg-dark !border-light",
            sharedClassName,
            firstClassName
          )}
          {...shared}
          {...first}
          {...(swap ? getSwapProps(first.tail, SwapDoubleInputId.First) : {})}
          ref={
            // If not swapping, use first input for ref. Otherwise, set ref to currently visible.
            !swap || swapInputShowing === SwapDoubleInputId.First
              ? ref
              : undefined
          }
        />

        <Input
          containerClassName={cn(
            "flex-1 mt-2",
            "sm:mt-0 sm:ml-5",
            {
              hidden: swapInputShowing === SwapDoubleInputId.First,
              "!mt-0 !ml-0": swap,
            },
            sharedContainerClassName,
            secondContainerClassName
          )}
          className={cn(
            "!bg-dark !border-light",
            sharedClassName,
            secondClassName
          )}
          {...shared}
          {...second}
          {...(swap ? getSwapProps(second.tail, SwapDoubleInputId.Second) : {})}
          ref={
            // If not swapping, use first input for ref. Otherwise, set ref to currently visible.
            swap && swapInputShowing === SwapDoubleInputId.Second
              ? ref
              : undefined
          }
        />
      </div>
    )
  }
)
DoubleInput.displayName = "DoubleInput"

interface UnforwardedPercentTokenDoubleInputProps
  extends UnforwardedDoubleInputProps {
  value?: number | undefined
  onChangeAmount: (amount: any) => void
  maxValue: number
  currency: string
}
export const PercentTokenDoubleInput = forwardRef<
  HTMLInputElement,
  UnforwardedPercentTokenDoubleInputProps
>(
  (
    {
      shared: { className: sharedClassName, ...shared } = {},
      first,
      second,
      value,
      onChangeAmount,
      maxValue,
      currency,
      ...props
    },
    ref
  ) => (
    <DoubleInput
      shared={{
        ...shared,
        type: "number",
        inputMode: "numeric",
        className: cn("!pr-40", sharedClassName),
      }}
      first={{
        ...first,
        onChange: (e) => {
          // If empty string, just pass along so the input can clear.
          if (!e.target.value.trim()) return onChangeAmount("")

          // Convert from percent to tokens
          const newValue = Number(e.target.value) || 0
          const tokens = maxValue * (newValue / 100)
          onChangeAmount(tokens)
        },
        tail: "%",
        // Convert from tokens to percent
        value:
          maxValue > 0 && !!value
            ? prettyPrintDecimal((100 * value) / maxValue, 6)
            : value,
      }}
      second={{
        ...second,
        onChange: (e) => {
          // If empty string, just pass along so the input can clear.
          if (!e.target.value.trim()) return onChangeAmount("")

          onChangeAmount(Number(e.target.value))
        },
        value: value,
        tail: currency,
      }}
      {...props}
      ref={ref}
    />
  )
)
PercentTokenDoubleInput.displayName = "PercentTokenDoubleInput"

// TextArea

type UnforwardedTextAreaProps = DetailedHTMLProps<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>
export const TextArea = forwardRef<
  HTMLTextAreaElement,
  UnforwardedTextAreaProps
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "bg-card placeholder:text-placeholder",
      "py-3 px-7 w-full",
      "rounded-3xl",
      "border border-card focus:outline-none focus:border-green",
      "transition",
      className
    )}
    {...props}
    ref={ref}
  />
))
TextArea.displayName = "TextArea"

// Switch

interface SwitchProps {
  on: boolean
  onClick: () => void
  className?: string
}
export const Switch: FC<SwitchProps> = ({ on, onClick, className }) => (
  <div
    className={cn(
      "relative cursor-pointer hover:opacity-70",
      "w-[80px] h-[42px] rounded-full",
      "bg-dark border border-light",
      className
    )}
    onClick={onClick}
  >
    <div
      className={cn(
        "absolute",
        "left-[4.5px] top-[3.5px] w-[32px] h-[32px] rounded-full",
        "bg-light transition-all",
        {
          "!left-[41.5px]": on,
        }
      )}
    ></div>
  </div>
)

// Form-wrapped components

interface FormItemProps {
  label?: string
  description?: string
  accent?: string
  error?: string
  wrapperClassName?: string
  surroundingClassName?: string
  horizontal?: boolean
}

type FormWrapperProps = PropsWithChildren<FormItemProps>

export const FormWrapper: FC<FormWrapperProps> = ({
  children,
  label,
  description,
  accent,
  error,
  wrapperClassName,
  surroundingClassName,
  horizontal,
}) => (
  <div
    className={cn(
      "mb-10",
      {
        "flex flex-row items-center": horizontal,
      },
      wrapperClassName
    )}
  >
    {horizontal && children}
    <div className={cn("flex flex-col items-stretch")}>
      {!!label && (
        <label
          className={cn(
            "font pl-5",
            "text-medium",
            {
              "mb-1": description,
              "mb-2": !description && !horizontal,
            },
            surroundingClassName
          )}
        >
          {label}
        </label>
      )}
      {!!description && (
        <p
          className={cn(
            "block text-sm font-extralight pl-5",
            { "mb-3": !horizontal },
            surroundingClassName
          )}
        >
          {description}
        </p>
      )}
      {!horizontal && children}
      {!!accent && (
        <p
          className={cn(
            "block text-sm font-extralight pl-5 text-green",
            { "mt-1": horizontal, "mt-3": !horizontal },
            surroundingClassName
          )}
        >
          {accent}
        </p>
      )}
      {!!error && (
        <p
          className={cn(
            "pl-5 text-orange",
            { "mt-1": horizontal, "mt-2": !horizontal },
            surroundingClassName
          )}
        >
          {error}
        </p>
      )}
    </div>
  </div>
)

type UnforwardedFormInputProps = UnforwardedInputProps & FormItemProps

export const FormInput = forwardRef<
  HTMLInputElement,
  UnforwardedFormInputProps
>(
  (
    {
      label,
      description,
      accent,
      error,
      wrapperClassName,
      surroundingClassName,
      containerClassName,
      className,
      ...props
    },
    ref
  ) => (
    <FormWrapper
      label={label}
      description={description}
      accent={accent}
      error={error}
      wrapperClassName={wrapperClassName}
      surroundingClassName={surroundingClassName}
    >
      <Input
        containerClassName={containerClassName}
        className={cn(
          "!bg-dark !border-light",
          { "!border-orange": !!error },
          className
        )}
        {...props}
        ref={ref}
      />
    </FormWrapper>
  )
)
FormInput.displayName = "FormInput"

type UnforwardedFormTextAreaProps = UnforwardedTextAreaProps & FormItemProps

export const FormTextArea = forwardRef<
  HTMLTextAreaElement,
  UnforwardedFormTextAreaProps
>(
  (
    {
      label,
      description,
      accent,
      error,
      wrapperClassName,
      surroundingClassName,
      className,
      ...props
    },
    ref
  ) => (
    <FormWrapper
      label={label}
      description={description}
      accent={accent}
      error={error}
      wrapperClassName={wrapperClassName}
      surroundingClassName={surroundingClassName}
    >
      <TextArea
        className={cn(
          "!bg-dark !border-light",
          { "!border-orange": !!error },
          className
        )}
        {...props}
        ref={ref}
      />
    </FormWrapper>
  )
)
FormTextArea.displayName = "FormTextArea"

type FormSwitchProps = SwitchProps & FormItemProps

export const FormSwitch: FC<FormSwitchProps> = ({
  label,
  description,
  accent,
  error,
  wrapperClassName,
  surroundingClassName,
  className,
  ...props
}) => (
  <FormWrapper
    label={label}
    description={description}
    accent={accent}
    error={error}
    wrapperClassName={wrapperClassName}
    surroundingClassName={surroundingClassName}
    horizontal
  >
    <Switch className={cn("shrink-0", className)} {...props} />
  </FormWrapper>
)

type UnforwardedFormDoubleInputProps = UnforwardedDoubleInputProps &
  FormItemProps

export const FormDoubleInput = forwardRef<
  HTMLInputElement,
  UnforwardedFormDoubleInputProps
>(
  (
    {
      label,
      description,
      accent,
      error,
      wrapperClassName,
      surroundingClassName,
      shared: { className: sharedClassName, ...shared } = {},
      ...props
    },
    ref
  ) => (
    <FormWrapper
      label={label}
      description={description}
      accent={accent}
      error={error}
      wrapperClassName={wrapperClassName}
      surroundingClassName={surroundingClassName}
    >
      <DoubleInput
        shared={{
          className: cn({ "!border-orange": !!error }, sharedClassName),
          ...shared,
        }}
        {...props}
        ref={ref}
      />
    </FormWrapper>
  )
)
FormDoubleInput.displayName = "FormDoubleInput"

type UnforwardedFormPercentTokenDoubleInputProps =
  UnforwardedPercentTokenDoubleInputProps & Omit<FormItemProps, "horizontal">

export const FormPercentTokenDoubleInput = forwardRef<
  HTMLInputElement,
  UnforwardedFormPercentTokenDoubleInputProps
>(
  (
    {
      label,
      description,
      accent,
      error,
      wrapperClassName,
      surroundingClassName,
      shared: { className: sharedClassName, ...shared } = {},
      ...props
    },
    ref
  ) => (
    <FormWrapper
      label={label}
      description={description}
      accent={accent}
      error={error}
      wrapperClassName={wrapperClassName}
      surroundingClassName={surroundingClassName}
    >
      <PercentTokenDoubleInput
        shared={{
          className: cn({ "!border-orange": !!error }, sharedClassName),
          ...shared,
        }}
        {...props}
        ref={ref}
      />
    </FormWrapper>
  )
)
FormPercentTokenDoubleInput.displayName = "FormPercentTokenDoubleInput"

interface ControlledFormPercentTokenDoubleInputProps
  extends Omit<UnforwardedFormPercentTokenDoubleInputProps, "onChangeAmount"> {
  control?: Control<FieldValues, object>
  name: string
}

export const ControlledFormPercentTokenDoubleInput: FC<
  ControlledFormPercentTokenDoubleInputProps
> = ({ control, name, maxValue, currency, shared, second, ...props }) => (
  <Controller
    control={control}
    name={name}
    rules={{
      required: "Required",
      pattern: /^\s*\d+\s*$/,
      min: {
        value: 0,
        message: "Must be at least 0.",
      },
      max: {
        value: maxValue,
        message: `Must be less than or equal to the max value: 100% / ${prettyPrintDecimal(
          maxValue
        )} ${currency}.`,
      },
    }}
    render={({
      field: { onChange, onBlur, value, ref, ...field },
      fieldState: { error },
    }) => (
      <FormPercentTokenDoubleInput
        error={error?.message}
        maxValue={maxValue}
        currency={currency}
        value={value}
        onChangeAmount={onChange}
        shared={{
          onBlur,
          className: cn({ "!border-orange": !!error }),
          ...shared,
        }}
        second={{
          ...second,
          ...field,
        }}
        {...props}
      />
    )}
  />
)

type InitialDistributionsFieldEditorProps = {
  initialSupply: number
  tokenSymbol: string
} & (
  | {
      creating: false
      initialDistribution: InitialDistribution
      onRemove: () => void
      fields?: never
      append?: never
      update?: never
    }
  | {
      creating: true
      initialDistribution?: never
      onRemove?: never
      fields: FieldArrayWithId<
        Partial<NewCampaign>,
        "initialDistributions",
        "id"
      >[]
      append: (
        value: Partial<InitialDistribution> | Partial<InitialDistribution>[],
        options?: FieldArrayMethodProps | undefined
      ) => void
      update: (index: number, value: Partial<InitialDistribution>) => void
    }
)

export const InitialDistributionFieldEditor: FC<
  InitialDistributionsFieldEditorProps
> = ({
  initialSupply,
  tokenSymbol,
  creating,
  initialDistribution,
  onRemove,
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

  const addRecipient = () => {
    setAddressError("")
    setAmountError("")

    let valid = true

    const [cleanedAddress, addressValidationError] =
      validateAndCleanJunoAddress(address)
    if (addressValidationError) {
      addressRef?.current?.focus()
      valid = false
      setAddressError(addressValidationError)
    }

    if (!validateInitialDistributionAmount(amount, initialSupply)) {
      // If not yet invalid (thus hasn't focused address field due to error), focus this field.
      if (valid) amountRef?.current?.focus()
      valid = false
      setAmountError(
        `Must be between 0% (0 ${tokenSymbol}) and 100% (${prettyPrintDecimal(
          initialSupply
        )} ${tokenSymbol}).`
      )
    }

    if (!valid) return

    const newInitialDistribution = { address: cleanedAddress, amount }

    // If duplicate address, update instead of append.
    const existingIndex = fields?.findIndex(
      ({ address }) => address === cleanedAddress
    )
    if (typeof existingIndex === "number" && existingIndex > -1)
      update?.(existingIndex, newInitialDistribution)
    else append?.(newInitialDistribution)

    // Clear state on add.
    setAddress("")
    setAmount(0)
  }

  return (
    <div
      className={cn(
        "flex",
        {
          "flex-row justify-between items-start": !creating,
          "flex-col justify-start items-stretch": creating,
        },
        "border-b border-light last:border-none",
        "p-5 pr-0 first:pt-0"
      )}
    >
      <div>
        {creating ? (
          <>
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

            <Button onClick={addRecipient}>Add Recipient</Button>
          </>
        ) : (
          <>
            <h3 className={cn("text-green text-lg")}>
              {initialDistribution!.address}
            </h3>

            <p className={cn("text-light text-base")}>
              {`${
                initialSupply > 0
                  ? prettyPrintDecimal(
                      (100 * initialDistribution!.amount) / initialSupply,
                      6
                    )
                  : "0"
              }% of total tokens / `}
              {prettyPrintDecimal(initialDistribution!.amount)} {tokenSymbol}
            </p>
          </>
        )}
      </div>

      {!creating && (
        <Button color="orange" onClick={onRemove} simple>
          <IoCloseSharp size={24} />
        </Button>
      )}
    </div>
  )
}
