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
    <section className={`glass-panel p-4 sm:p-6 ${className}`}>
      <div className="mb-4 flex flex-col gap-3 border-b border-[var(--border-strong)] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold text-[var(--accent)]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}
