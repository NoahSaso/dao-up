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
      "w-[98px] h-[50px] rounded-full",
      "bg-dark border border-light",
      className
    )}
    onClick={onClick}
  >
    <div
      className={cn(
        "absolute",
        "left-[7.5px] top-[7.5px] w-[32px] h-[32px] rounded-full",
        "bg-light transition-all",
        {
          "!left-[56.5px]": on,
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
}

type FormWrapperProps = PropsWithChildren<FormItemProps>

const FormWrapper: FC<FormWrapperProps> = ({
  children,
  label,
  description,
  accent,
  error,
  wrapperClassName,
  surroundingClassName,
}) => (
  <div className={cn("flex flex-col items-stretch mb-10", wrapperClassName)}>
    {!!label && (
      <label
        className={cn(
          "font pl-5",
          "text-medium",
          {
            "mb-1": description,
            "mb-2": !description,
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
          "block text-sm font-extralight pl-5 mb-3",
          surroundingClassName
        )}
      >
        {description}
      </p>
    )}
    {children}
    {!!accent && (
      <p
        className={cn(
          "block text-sm font-extralight pl-5 mt-3 text-green",
          surroundingClassName
        )}
      >
        {accent}
      </p>
    )}
    {!!error && (
      <p className={cn("pl-5 mt-2 text-orange", surroundingClassName)}>
        {error}
      </p>
    )}
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
  >
    <Switch className={cn("!ml-5 mt-2", className)} {...props} />
  </FormWrapper>
)
