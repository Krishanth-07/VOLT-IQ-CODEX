import type { ReactNode } from 'react'

type SectionCardProps = {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({
  eyebrow,
  title,
  description,
  action,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <section className={`glass-panel p-5 sm:p-6 ${className}`}>
      <div className="mb-5 flex flex-col gap-4 border-b border-[var(--border-strong)] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 font-display text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}
