type MetricCardProps = {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'positive' | 'warning'
}

export function MetricCard({
  label,
  value,
  hint,
  tone = 'default',
}: MetricCardProps) {
  const toneStyle =
    tone === 'positive'
      ? {
          borderColor: 'color-mix(in srgb, var(--success) 35%, var(--border-strong))',
          backgroundColor: 'color-mix(in srgb, var(--success) 10%, var(--bg-surface))',
        }
      : tone === 'warning'
        ? {
            borderColor: 'color-mix(in srgb, var(--warning) 35%, var(--border-strong))',
            backgroundColor: 'color-mix(in srgb, var(--warning) 10%, var(--bg-surface))',
          }
        : {
            borderColor: 'var(--border-strong)',
            backgroundColor: 'var(--bg-surface)',
          }

  return (
    <div className="rounded-xl border p-4 sm:p-5" style={toneStyle}>
      <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
      <p className="num-mono mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
        {value}
      </p>
      {hint ? <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{hint}</p> : null}
    </div>
  )
}
