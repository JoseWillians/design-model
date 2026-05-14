import type { ButtonHTMLAttributes, ReactNode } from "react";

type AccessibleName =
  | {
      "aria-label": string;
      title?: string;
    }
  | {
      "aria-label"?: string;
      title: string;
    };

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> &
  AccessibleName & {
    icon: ReactNode;
    active?: boolean;
    tooltip?: string;
  };

export function IconButton({
  icon,
  active = false,
  tooltip,
  className,
  type = "button",
  title,
  "aria-label": ariaLabel,
  ...props
}: IconButtonProps) {
  const accessibleName = ariaLabel ?? title;

  return (
    <button
      aria-label={accessibleName}
      aria-pressed={active || undefined}
      className={["icon-button", active ? "icon-button--active" : "", className]
        .filter(Boolean)
        .join(" ")}
      title={tooltip ?? title ?? accessibleName}
      type={type}
      {...props}
    >
      <span aria-hidden="true" className="icon-button__icon">
        {icon}
      </span>
    </button>
  );
}

export default IconButton;
