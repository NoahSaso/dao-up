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

interface FormItemProps {
  label?: string
  description?: string
  error?: string
  wrapperClassName?: string
}

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

type FormWrapperProps = PropsWithChildren<FormItemProps>

const FormWrapper: FC<FormWrapperProps> = ({
  children,
  label,
  description,
  error,
  wrapperClassName,
}) => (
  <div className={cn("flex flex-col items-stretch", wrapperClassName)}>
    {!!label && (
      <label
        className={cn("block pl-5", {
          "mb-1": description,
          "mb-2": !description,
        })}
      >
        {label}
      </label>
    )}
    {!!description && (
      <p className="block text-sm font-extralight pl-5 mb-3">{description}</p>
    )}
    {children}
    {!!error && <p className="pl-5 -mt-8 mb-10 text-orange">{error}</p>}
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
      error,
      wrapperClassName,
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
      error={error}
      wrapperClassName={wrapperClassName}
    >
      <Input
        containerClassName={cn("mb-10", containerClassName)}
        className={cn("!bg-dark !border-light", className)}
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
    { label, description, error, wrapperClassName, className, ...props },
    ref
  ) => (
    <FormWrapper
      label={label}
      description={description}
      error={error}
      wrapperClassName={wrapperClassName}
    >
      <TextArea
        className={cn("mb-10 !bg-dark !border-light", className)}
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
  error,
  wrapperClassName,
  className,
  ...props
}) => (
  <FormWrapper
    label={label}
    description={description}
    error={error}
    wrapperClassName={wrapperClassName}
  >
    <Switch className={cn("mb-10", className)} {...props} />
  </FormWrapper>
)
