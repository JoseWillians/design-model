import type { ButtonHTMLAttributes, ReactNode } from "react";

export type TemplateCardProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  title: string;
  description?: string;
  thumbnail?: ReactNode;
  meta?: ReactNode;
  tags?: string[];
  selected?: boolean;
};

export function TemplateCard({
  title,
  description,
  thumbnail,
  meta,
  tags = [],
  selected = false,
  className,
  type = "button",
  ...props
}: TemplateCardProps) {
  return (
    <button
      aria-pressed={selected}
      className={["template-card", selected ? "template-card--selected" : "", className]
        .filter(Boolean)
        .join(" ")}
      type={type}
      {...props}
    >
      {thumbnail ? (
        <span aria-hidden="true" className="template-card__thumbnail">
          {thumbnail}
        </span>
      ) : null}

      <span className="template-card__content">
        <span className="template-card__header">
          <span className="template-card__title">{title}</span>
          {meta ? <span className="template-card__meta">{meta}</span> : null}
        </span>

        {description ? <span className="template-card__description">{description}</span> : null}

        {tags.length > 0 ? (
          <span aria-label="Categorias do template" className="template-card__tags" role="list">
            {tags.map((tag) => (
              <span className="template-card__tag" key={tag} role="listitem">
                {tag}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export default TemplateCard;
