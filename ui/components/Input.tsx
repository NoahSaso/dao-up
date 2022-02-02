import cn from "classnames"
import {
  DetailedHTMLProps,
  FC,
  forwardRef,
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode,
  TextareaHTMLAttributes,
} from "react"
import { Control, Controller, FieldValues } from "react-hook-form"

import { prettyPrintDecimal } from "../helpers/number"

// Input

interface UnforwardedInputProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  containerClassName?: string
  tail?: ReactNode
  tailContainerClassName?: string
}
export const Input = forwardRef<HTMLInputElement, UnforwardedInputProps>(
  (
    { containerClassName, className, tail, tailContainerClassName, ...props },
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
            "absolute top-0 right-0 bottom-0",
            tailContainerClassName
          )}
        >
          {tail}
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
    },
    ref
  ) => (
    <div
      className={cn(
        "flex flex-col items-stretch sm:flex-row",
        containerClassName
      )}
    >
      <Input
        containerClassName={cn(
          "flex-1",
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
        ref={ref}
      />

      <Input
        containerClassName={cn(
          "flex-1 mt-2",
          "sm:mt-0 sm:ml-5",
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
        ref={undefined}
      />
    </div>
  )
)
DoubleInput.displayName = "DoubleInput"

interface UnforwardedPercentTokenDoubleInputProps
  extends UnforwardedDoubleInputProps {
  value: number | undefined
  onChangeAmount: (amount: any) => void
  maxValue: number
  currency: string
}
export const PercentTokenDoubleInput: FC<UnforwardedPercentTokenDoubleInputProps> =
  forwardRef<HTMLInputElement, UnforwardedPercentTokenDoubleInputProps>(
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
          tail: (
            <div className="h-full px-6 rounded-full bg-light flex items-center text-center text-dark">
              %
            </div>
          ),
          // Convert from tokens to percent
          value:
            maxValue > 0 && !!value
              ? Number(((100 * value) / maxValue).toFixed(6))
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
          tail: (
            <div className="h-full px-6 rounded-full bg-light flex items-center text-center text-dark">
              {currency}
            </div>
          ),
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

interface FormPercentTokenDoubleInputProps {
  control: Control<FieldValues, object>
  name: string
  label?: string
  description?: string
  placeholder?: string
  maxValue: number
  currency: string
  wrapperClassName?: string
  extraProps?: Partial<UnforwardedPercentTokenDoubleInputProps>
}
export const FormPercentTokenDoubleInput: FC<
  FormPercentTokenDoubleInputProps
> = ({
  control,
  name,
  label,
  description,
  placeholder,
  maxValue,
  currency,
  wrapperClassName,
  extraProps: { shared, second, ...extraProps } = {},
}) => (
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
        message: `Must be less than or equal to the max value: ${prettyPrintDecimal(
          maxValue
        )} ${currency} (100%).`,
      },
    }}
    render={({
      field: { onChange, onBlur, value, ref, ...field },
      fieldState: { error },
    }) => (
      <FormWrapper
        label={label}
        description={description}
        wrapperClassName={wrapperClassName}
        error={error?.message}
      >
        <PercentTokenDoubleInput
          {...extraProps}
          maxValue={maxValue}
          currency={currency}
          value={value}
          onChangeAmount={onChange}
          shared={{
            onBlur,
            placeholder,
            type: "number",
            inputMode: "numeric",
            className: cn("!pr-40", { "!border-orange": !!error }),
            ...shared,
          }}
          second={{
            ...second,
            ...field,
          }}
        />
      </FormWrapper>
    )}
  />
)
