import type { HTMLAttributes, ReactNode } from "react";
import { useId } from "react";

export type PropertyFieldProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  htmlFor?: string;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
};

export function PropertyField({
  label,
  htmlFor,
  description,
  error,
  required = false,
  children,
  className,
  id,
  ...props
}: PropertyFieldProps) {
  const generatedId = useId();
  const rootId = id ?? generatedId;
  const descriptionId = description ? `${rootId}-description` : undefined;
  const errorId = error ? `${rootId}-error` : undefined;

  return (
    <div className={["property-field", className].filter(Boolean).join(" ")} id={rootId} {...props}>
      <label className="property-field__label" htmlFor={htmlFor}>
        <span>{label}</span>
        {required ? (
          <span aria-hidden="true" className="property-field__required">
            *
          </span>
        ) : null}
      </label>

      {description ? (
        <p className="property-field__description" id={descriptionId}>
          {description}
        </p>
      ) : null}

      <div
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined}
        className="property-field__control"
      >
        {children}
      </div>

      {error ? (
        <p className="property-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default PropertyField;
