import cn from "classnames"
import {
  DetailedHTMLProps,
  forwardRef,
  FunctionComponent,
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode,
  TextareaHTMLAttributes,
  useState,
} from "react"
import { Control, Controller, FieldValues } from "react-hook-form"
import { IoCaretDown } from "react-icons/io5"

import { Button } from "@/components"
import {
  convertMicroDenomToDenom,
  numberPattern,
  prettyPrintDecimal,
} from "@/helpers"

// Input

interface UnforwardedInputProps
  extends PropsWithChildren<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
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
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <div
      className={cn(
        "flex flex-row justify-between items-stretch gap-3",
        containerClassName
      )}
    >
      <div className="relative w-full flex-1">
        <input
          className={cn(
            "bg-card placeholder:text-placeholder",
            "py-3 px-7 w-full",
            "rounded-full",
            "border border-card focus:outline-none focus:border-green",
            "transition",
            { "opacity-40 pointer-events-none cursor-not-allowed": disabled },
            className
          )}
          disabled={disabled}
          {...props}
          ref={ref}
        />
        {!!tail && (
          <div
            className={cn(
              "absolute top-[1px] right-[1px] bottom-[1px] rounded-full",
              { "opacity-40 pointer-events-none cursor-not-allowed": disabled },
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

      {children && (
        <div className="shrink-0 flex flex-row items-stretch">{children}</div>
      )}
    </div>
  )
)
Input.displayName = "Input"

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
  onClick?: () => void
  className?: string
}

export const Switch: FunctionComponent<SwitchProps> = ({
  on,
  onClick,
  className,
}) => (
  <div
    className={cn(
      "relative cursor-pointer hover:opacity-70",
      "w-[80px] h-[42px] rounded-full",
      "border",
      "flex items-center",
      {
        "bg-green border-green": on,
        "bg-dark border-light": !on,
      },
      className
    )}
    onClick={onClick}
  >
    <div
      className={cn(
        "absolute",
        "w-[32px] h-[32px] rounded-full",
        "transition-all",
        {
          "bg-dark left-[41.5px]": on,
          "bg-light left-[4.5px]": !on,
        }
      )}
    ></div>
  </div>
)

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
          <IoCaretDown size={18} className="ml-2" />
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
  currencySymbol: string
  currencyDecimals: number
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
      currencySymbol,
      currencyDecimals,
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

          // Convert from percent to tokens.
          const newValue = Number(e.target.value) || 0
          const tokens = maxValue * (newValue / 100)
          onChangeAmount(tokens)
        },
        tail: "%",
        // Convert from tokens to percent.
        value:
          maxValue > 0 && !!value
            ? // Only display 2 decimals.
              Number(((100 * value) / maxValue).toFixed(2))
            : value,
      }}
      second={{
        ...second,
        onChange: (e) => {
          // If empty string, just pass along so the input can clear.
          if (!e.target.value.trim()) return onChangeAmount("")

          onChangeAmount(Number(e.target.value))
        },
        // Only display N decimals.
        value: value ? Number(value.toFixed(currencyDecimals)) : value,
        tail: currencySymbol,
        step: convertMicroDenomToDenom(1, currencyDecimals),
      }}
      {...props}
      ref={ref}
    />
  )
)
PercentTokenDoubleInput.displayName = "PercentTokenDoubleInput"

// Form-wrapped components

interface FormItemProps {
  label?: ReactNode
  description?: string
  accent?: ReactNode
  accentClassName?: string
  error?: ReactNode
  wrapperClassName?: string
  onClick?: () => void
}

type FormWrapperProps = PropsWithChildren<FormItemProps>

export const FormWrapper: FunctionComponent<FormWrapperProps> = ({
  children,
  label,
  description,
  accent,
  accentClassName,
  error,
  wrapperClassName,
  onClick,
}) => (
  <div className={cn("mb-10", wrapperClassName)} onClick={onClick}>
    <div className="flex flex-col items-stretch">
      {!!label && (
        <label
          className={cn("font pl-5", "text-medium", {
            "mb-1": description,
            "mb-2": !description,
          })}
        >
          {label}
        </label>
      )}
      {!!description && (
        <p className="block text-sm font-light pl-5 mb-3">{description}</p>
      )}
      {children}
      {!!accent && (
        <p
          className={cn(
            "block text-sm font-light pl-5 text-green mt-3",
            accentClassName
          )}
        >
          {accent}
        </p>
      )}
      {!!error && <p className="pl-5 text-orange mt-2 break-words">{error}</p>}
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
      accentClassName,
      error,
      wrapperClassName,
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
      accentClassName={accentClassName}
      error={error}
      wrapperClassName={wrapperClassName}
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

export const FormSwitch: FunctionComponent<FormSwitchProps> = ({
  label,
  description,
  error,
  accentClassName,
  wrapperClassName,
  className,
  onClick,
  ...props
}) => {
  const labelElem = !!label && (
    <label
      className={cn("text-medium text-sm xs:text-lg sm:text-base", {
        // If screen is larger, description moves to under switch.
        "sm:mb-1": description,
      })}
    >
      {label}
    </label>
  )
  const descriptionElem = !!description && (
    <p className="text-sm font-light">{description}</p>
  )

  return (
    <div
      className={cn(
        "mb-10 cursor-pointer flex flex-col items-stretch",
        wrapperClassName
      )}
      onClick={onClick}
    >
      <div className="flex flex-row items-center gap-3">
        <Switch className={cn("shrink-0", className)} {...props} />

        <div>
          {labelElem}
          <div className="hidden sm:block">{descriptionElem}</div>
        </div>
      </div>

      {descriptionElem && (
        <div className="mt-3 sm:hidden sm:mt-0">{descriptionElem}</div>
      )}

      {!!error && <p className="text-orange mt-2">{error}</p>}
    </div>
  )
}

type UnforwardedFormPercentTokenDoubleInputProps =
  UnforwardedPercentTokenDoubleInputProps & FormItemProps

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
  minValue?: number
  required?: boolean
}

export const ControlledFormPercentTokenDoubleInput: FunctionComponent<
  ControlledFormPercentTokenDoubleInputProps
> = ({
  control,
  name,
  minValue,
  maxValue,
  currencySymbol,
  currencyDecimals,
  required,
  shared,
  second,
  ...props
}) => {
  const min = minValue ?? convertMicroDenomToDenom(1, currencyDecimals)

  return (
    <Controller
      control={control}
      name={name}
      rules={{
        required: required ? "Required" : undefined,
        pattern: numberPattern,
        min: {
          value: min,
          message: `Must be at least ${prettyPrintDecimal(
            min / maxValue,
            2
          )}% / ${prettyPrintDecimal(
            min,
            currencyDecimals
          )} ${currencySymbol}.`,
        },
        max: {
          value: maxValue,
          message: `Must be less than or equal to 100% / ${prettyPrintDecimal(
            maxValue,
            currencyDecimals
          )} ${currencySymbol}.`,
        },
      }}
      render={({
        field: { onChange, onBlur, value, ref, ...field },
        fieldState: { error },
      }) => (
        <FormPercentTokenDoubleInput
          error={error?.message}
          maxValue={maxValue}
          currencySymbol={currencySymbol}
          currencyDecimals={currencyDecimals}
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
}
