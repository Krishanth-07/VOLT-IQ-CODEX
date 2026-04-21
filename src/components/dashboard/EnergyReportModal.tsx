import { useEffect, useMemo, useRef, useState } from 'react'

type AppliancePill = {
  label: string
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

type EnergyReportModalProps = {
  open: boolean
  onClose: () => void
  score: number
  gradeLabel: 'Good' | 'Fair' | 'Needs Attention'
  monthlyBill: number
  savingPotential: number
  solarVerdict: 'GO SOLAR' | 'NOT YET'
  appliances: AppliancePill[]
  topRecommendation: string
}

type Html2CanvasFn = (
  element: HTMLElement,
  options?: {
    scale?: number
    useCORS?: boolean
    backgroundColor?: string
  },
) => Promise<HTMLCanvasElement>

declare global {
  interface Window {
    html2canvas?: Html2CanvasFn
  }
}

const GRADE_PILL_STYLES: Record<AppliancePill['grade'], string> = {
  A: 'bg-[#14532D] text-white border border-[#00C46A]',
  B: 'bg-[#134E4A] text-white border border-[#14B8A6]',
  C: 'bg-[#78350F] text-white border border-[#F59E0B]',
  D: 'bg-[#7C2D12] text-white border border-[#F97316]',
  F: 'bg-[#7F1D1D] text-white border border-[#EF4444]',
}

function getScoreRingColor(score: number) {
  if (score > 70) return '#00C46A'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
}

export function EnergyReportModal({
  open,
  onClose,
  score,
  gradeLabel,
  monthlyBill,
  savingPotential,
  solarVerdict,
  appliances,
  topRecommendation,
}: EnergyReportModalProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [scriptReady, setScriptReady] = useState(false)

  useEffect(() => {
    if (!open) return

    if (window.html2canvas) {
      setScriptReady(true)
      return
    }

    const existingScript = document.getElementById('voltiq-html2canvas-cdn') as HTMLScriptElement | null
    if (existingScript) {
      const onLoad = () => setScriptReady(Boolean(window.html2canvas))
      existingScript.addEventListener('load', onLoad)
      return () => existingScript.removeEventListener('load', onLoad)
    }

    const script = document.createElement('script')
    script.id = 'voltiq-html2canvas-cdn'
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    script.async = true
    script.onload = () => setScriptReady(Boolean(window.html2canvas))
    document.body.appendChild(script)
  }, [open])

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  }, [])

  const ringColor = getScoreRingColor(score)
  const progress = Math.max(0, Math.min(score, 100))
  const circumference = 2 * Math.PI * 54
  const offset = circumference * (1 - progress / 100)

  async function downloadReport() {
    if (!cardRef.current || !window.html2canvas) return

    setDownloading(true)
    try {
      const canvas = await window.html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0A0E1A',
      })

      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = 'VoltIQ_Energy_Report.png'
      link.click()
    } finally {
      setDownloading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.85)] p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[400px]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-0 top-0 rounded-md border border-[#1F2937] bg-[#0A0E1A] px-3 py-1 text-xl leading-none text-white"
          aria-label="Close report"
        >
          X
        </button>

        <div className="mt-10 rounded-xl border border-[#1F2937] bg-[#0A0E1A] p-5" ref={cardRef}>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#00C46A]">VoltIQ Energy Report</p>
            <p className="mt-2 text-sm text-[#9CA3AF]">{monthLabel}</p>
          </div>

          <div className="mt-5 flex justify-center">
            <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Energy Health Score">
              <circle cx="70" cy="70" r="54" fill="none" stroke="#1F2937" strokeWidth="12" />
              <circle
                cx="70"
                cy="70"
                r="54"
                fill="none"
                stroke={ringColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 70 70)"
              />
              <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="white"
                fontSize="34"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
              >
                {score}
              </text>
            </svg>
          </div>

          <p className="mt-3 text-center text-base font-semibold text-white">{gradeLabel}</p>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md border border-[#1F2937] p-2">
              <p className="text-[11px] text-[#9CA3AF]">Monthly bill</p>
              <p className="mt-1 font-mono text-sm font-semibold text-white">Rs.{Math.round(monthlyBill)}</p>
            </div>
            <div className="rounded-md border border-[#1F2937] p-2">
              <p className="text-[11px] text-[#9CA3AF]">Saving potential</p>
              <p className="mt-1 font-mono text-sm font-semibold text-white">Rs.{Math.round(savingPotential)}</p>
            </div>
            <div className="rounded-md border border-[#1F2937] p-2">
              <p className="text-[11px] text-[#9CA3AF]">Solar verdict</p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-1 text-[11px] font-semibold ${
                  solarVerdict === 'GO SOLAR'
                    ? 'bg-[#14532D] text-white border border-[#00C46A]'
                    : 'bg-[#78350F] text-white border border-[#F59E0B]'
                }`}
              >
                {solarVerdict}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] text-[#9CA3AF]">Appliance health</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {appliances.map((item) => (
                <span key={`${item.label}-${item.grade}`} className={`rounded-full px-3 py-1 text-xs font-semibold ${GRADE_PILL_STYLES[item.grade]}`}>
                  {item.label} - {item.grade}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-4 text-sm italic text-white">Biggest opportunity: {topRecommendation}</p>

          <p className="mt-4 text-center text-xs text-[#9CA3AF]">Generated by VoltIQ · voltiq.in</p>
          <div className="mt-3 h-px w-full bg-[#00C46A]" />
        </div>

        <button
          type="button"
          onClick={() => void downloadReport()}
          disabled={!scriptReady || downloading}
          className="mt-4 w-full rounded-xl bg-[#00C46A] px-4 py-3 text-base font-bold text-[#04120A] disabled:opacity-60"
        >
          {downloading ? 'Preparing image...' : 'Download Report'}
        </button>
      </div>
    </div>
  )
}
