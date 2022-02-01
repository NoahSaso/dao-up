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
      tailContainerClassName,
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
        tailContainerClassName={cn(
          // TODO: remove once tails have buttons
          // "bg-card rounded-full",
          tailContainerClassName
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

type UnforwardedDoubleFormInputProps = {
  shared: UnforwardedInputProps
  first: UnforwardedInputProps
  second: UnforwardedInputProps
} & FormItemProps

export const DoubleFormInput = forwardRef<
  HTMLInputElement,
  UnforwardedDoubleFormInputProps
>(
  (
    {
      label,
      description,
      accent,
      error,
      wrapperClassName,
      surroundingClassName,
      shared: {
        containerClassName: sharedContainerClassName,
        className: sharedClassName,
        ...sharedProps
      },
      first: {
        containerClassName: firstContainerClassName,
        className: firstClassName,
        ...firstProps
      },
      second: {
        containerClassName: secondContainerClassName,
        className: secondClassName,
        ...secondProps
      },
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
      <div className="flex flex-col items-stretch sm:flex-row">
        <Input
          containerClassName={cn(
            "flex-1",
            sharedContainerClassName,
            firstContainerClassName
          )}
          className={cn(
            "!bg-dark !border-light",
            { "!border-orange": !!error },
            sharedClassName,
            firstClassName
          )}
          {...sharedProps}
          {...firstProps}
          ref={ref}
        />

        <Input
          containerClassName={cn(
            "flex-1 mt-5",
            "sm:mt-0 sm:ml-5",
            sharedContainerClassName,
            secondContainerClassName
          )}
          className={cn(
            "!bg-dark !border-light",
            { "!border-orange": !!error },
            sharedClassName,
            secondClassName
          )}
          {...sharedProps}
          {...secondProps}
          ref={undefined}
        />
      </div>
    </FormWrapper>
  )
)
DoubleFormInput.displayName = "DoubleFormInput"

interface PercentTokenDoubleInputProps {
  control: Control<FieldValues, object>
  name: string
  label?: string
  description?: string
  placeholder?: string
  initialSupply: number
  tokenSymbol: string
  wrapperClassName?: string
}
export const PercentTokenDoubleInput: FC<PercentTokenDoubleInputProps> = ({
  control,
  name,
  label,
  description,
  placeholder,
  initialSupply,
  tokenSymbol,
  wrapperClassName,
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
        value: initialSupply,
        message: `Must be less than or equal to the initial supply: ${prettyPrintDecimal(
          initialSupply
        )} ${tokenSymbol} (100%).`,
      },
    }}
    render={({
      field: { onChange, onBlur, value, ref, ...field },
      fieldState: { error },
    }) => (
      <DoubleFormInput
        label={label}
        description={description}
        wrapperClassName={wrapperClassName}
        error={error?.message}
        shared={{
          onBlur,
          placeholder,
          type: "number",
          inputMode: "numeric",
          className: "!pr-40",
        }}
        first={{
          onChange: (e) => {
            // If empty string, just pass along so the input can clear.
            if (!e.target.value.trim()) return onChange(e)

            // Convert from percent to tokens
            const newValue = Number(e.target.value) || 0
            const tokens = Math.round(initialSupply * (newValue / 100))
            onChange(tokens)
          },
          tail: (
            <div className="h-full px-6 rounded-full bg-light flex items-center text-center text-dark">
              %
            </div>
          ),
          // Convert from tokens to percent
          value:
            initialSupply > 0 && !!value
              ? (100 * value) / initialSupply
              : value,
        }}
        second={{
          onChange: (e) => {
            // If empty string, just pass along so the input can clear.
            if (!e.target.value.trim()) return onChange(e)

            onChange(Number(e.target.value))
          },
          value,
          tail: (
            <div className="h-full px-6 rounded-full bg-light flex items-center text-center text-dark">
              {tokenSymbol}
            </div>
          ),
          ...field,
        }}
        ref={ref}
      />
    )}
  />
)
