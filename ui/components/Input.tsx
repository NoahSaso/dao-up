import cn from "classnames"
import {
  DetailedHTMLProps,
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react"

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

interface UnforwardedFormInputProps extends UnforwardedInputProps {
  label?: string
  error?: string
}

export const FormInput = forwardRef<
  HTMLInputElement,
  UnforwardedFormInputProps
>(
  (
    {
      label,
      error,
      containerClassName,
      className,
      tailContainerClassName,
      ...props
    },
    ref
  ) => (
    <>
      {!!label && <label className="block pl-5 mb-2">{label}</label>}
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
      {!!error && <p className="pl-5 -mt-8 mb-10 text-orange">{error}</p>}
    </>
  )
)
FormInput.displayName = "FormInput"

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

interface UnforwardedFormTextAreaProps extends UnforwardedTextAreaProps {
  label?: string
  error?: string
}

export const FormTextArea = forwardRef<
  HTMLTextAreaElement,
  UnforwardedFormTextAreaProps
>(({ label, error, className, ...props }, ref) => (
  <>
    {!!label && <label className="block pl-5 mb-2">{label}</label>}
    <TextArea
      className={cn("mb-10 !bg-dark !border-light", className)}
      {...props}
      ref={ref}
    />
    {!!error && <p className="pl-5 -mt-8 mb-10 text-orange">{error}</p>}
  </>
))
FormTextArea.displayName = "FormTextArea"
