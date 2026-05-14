import type { HTMLAttributes, ReactNode } from "react";

export type PanelProps = HTMLAttributes<HTMLElement> & {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
};

export function Panel({
  title,
  description,
  actions,
  footer,
  children,
  className,
  ...props
}: PanelProps) {
  const hasHeader = Boolean(title || description || actions);

  return (
    <section className={["panel", className].filter(Boolean).join(" ")} {...props}>
      {hasHeader ? (
        <header className="panel__header">
          <div className="panel__heading">
            {title ? <h2 className="panel__title">{title}</h2> : null}
            {description ? <p className="panel__description">{description}</p> : null}
          </div>
          {actions ? <div className="panel__actions">{actions}</div> : null}
        </header>
      ) : null}

      <div className="panel__body">{children}</div>

      {footer ? <footer className="panel__footer">{footer}</footer> : null}
    </section>
  );
}

export default Panel;
