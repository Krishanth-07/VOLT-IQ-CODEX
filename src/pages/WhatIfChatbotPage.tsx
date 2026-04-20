import { useMemo, useState } from 'react'
import { SectionCard } from '../components/common/SectionCard'
import { useEnergy } from '../context/EnergyContext'
import { askGeminiWhatIf, type WhatIfMessage } from '../services/gemini'
import { calculateSolarOutcome } from '../utils/solar'
import { formatCurrency } from '../utils/format'
import { getEffectiveTariffSlabs } from '../utils/tariff'

const STARTER_CHIPS = [
  'What if I replace my 2014 AC?',
  'What if I run AC 2 hours less per day?',
  'What if electricity prices rise 15% next year?',
  'What if I install 3kW solar panels?',
]

function renderHighlightedRupees(content: string) {
  const parts = content.split(/(₹\s?[\d,]+(?:\.\d+)?|Rs\.?\s?[\d,]+(?:\.\d+)?)/gi)

  return parts.map((part, index) => {
    const isCurrency = /(₹\s?[\d,]+(?:\.\d+)?|Rs\.?\s?[\d,]+(?:\.\d+)?)/i.test(part)
    if (isCurrency) {
      return (
        <span key={`currency-${index}`} className="font-semibold text-[var(--accent)]">
          {part}
        </span>
      )
    }

    return <span key={`text-${index}`}>{part}</span>
  })
}

function buildSystemPrompt(params: {
  state: string
  billAmount: number
  units: number
  slabRate: number
  unitsIntoSlab: number
  applianceList: string
  solarVerdict: string
  solarPaybackYears: number
  tariffSlabs: string
}) {
  return `You are VoltIQ's What-If energy advisor for a specific user.

USER CONTEXT:
- State: ${params.state}
- Monthly bill: Rs.${Math.round(params.billAmount)}
- Monthly units: ${params.units.toFixed(1)}
- Current tariff slab: Rs.${params.slabRate.toFixed(2)}/unit
- Units into current slab: ${params.unitsIntoSlab.toFixed(1)}
- Appliances: ${params.applianceList}
- Solar verdict: ${params.solarVerdict} — payback ${params.solarPaybackYears.toFixed(1)} years

TARIFF SLABS FOR ${params.state}:
${params.tariffSlabs}

RULES:
- Always answer in exact rupees, never vague percentages alone
- Always show before vs after bill comparison
- If asked about solar, use their exact roof and city data
- Keep responses under 120 words
- If a question is unrelated to energy, politely redirect
- Never make up data — use only what's in the user context`
}

function buildLocalFallback(question: string, currentBill: number, solarMonthlySaving: number) {
  const lowered = question.toLowerCase()

  if (lowered.includes('solar')) {
    return `Based on your current context, your bill can move from ${formatCurrency(currentBill)} to approximately ${formatCurrency(
      Math.max(currentBill - solarMonthlySaving, 0),
    )} with rooftop solar assumptions already in your profile.`
  }

  if (lowered.includes('ac') || lowered.includes('hour')) {
    const roughSavings = Math.round(currentBill * 0.08)
    return `If you reduce heavy appliance runtime, a realistic first estimate is a ${formatCurrency(
      roughSavings,
    )} monthly reduction, moving your bill from ${formatCurrency(currentBill)} to ${formatCurrency(
      Math.max(currentBill - roughSavings, 0),
    )}.`
  }

  return `Using your existing data, we can compare a before bill of ${formatCurrency(currentBill)} against an after scenario once you specify one concrete change (appliance swap, runtime cut, or solar size).`
}

export function WhatIfChatbotPage() {
  const {
    input,
    currentBill,
    currentUnits,
    currentScenario,
    currentEntries,
    tariffProfile,
    solarInputs,
  } = useEnergy()
  const solarOutcome = calculateSolarOutcome(solarInputs)

  const [messages, setMessages] = useState<WhatIfMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(false)

  const applianceList = useMemo(() => {
    return currentEntries
      .map((entry) => {
        const breakdown = currentScenario.applianceBreakdown.find((item) => item.id === entry.id)
        return `${entry.name}: ${entry.wattage}W, ${entry.hours.toFixed(1)}h/day, monthly cost ${formatCurrency(
          breakdown?.cost ?? 0,
        )}`
      })
      .join(' | ')
  }, [currentEntries, currentScenario.applianceBreakdown])

  const tariffSlabs = useMemo(() => {
    const effectiveSlabs = getEffectiveTariffSlabs(currentUnits, tariffProfile)

    return effectiveSlabs
      .map((slab) => `${slab.bandLabel}: ₹${slab.rate.toFixed(2)}/unit (${slab.minUnits} to ${slab.maxUnits ?? 'above'})`)
      .join('\n')
  }, [currentUnits, tariffProfile])

  const systemPrompt = useMemo(
    () =>
      buildSystemPrompt({
        state: input.state,
        billAmount: currentBill,
        units: currentUnits,
        slabRate: currentScenario.slabStatus.slab.rate,
        unitsIntoSlab: currentScenario.slabStatus.unitsIntoSlab,
        applianceList,
        solarVerdict: solarOutcome.verdict,
        solarPaybackYears: solarOutcome.paybackYears,
        tariffSlabs,
      }),
    [
      applianceList,
      currentBill,
      currentScenario.slabStatus.slab.rate,
      currentScenario.slabStatus.unitsIntoSlab,
      currentUnits,
      input.state,
      solarOutcome.paybackYears,
      solarOutcome.verdict,
      tariffSlabs,
    ],
  )

  async function submitQuestion(question: string) {
    if (!question.trim() || loading) return

    if (cooldown) {
      setError('Please wait a second before sending another question.')
      return
    }

    const userMessage: WhatIfMessage = { role: 'user', content: question.trim() }
    const nextConversation = [...messages, userMessage]
    setMessages(nextConversation)
    setDraft('')
    setLoading(true)
    setCooldown(true)
    setTimeout(() => setCooldown(false), 1500)
    setError(null)

    try {
      const answer = await askGeminiWhatIf({
        systemPrompt,
        conversationHistory: nextConversation,
      })
      setMessages((current) => [...current, { role: 'assistant', content: answer }])
    } catch (caughtError) {
      const fallback = buildLocalFallback(question, currentBill, solarOutcome.monthlySavings)
      const message = caughtError instanceof Error ? caughtError.message : 'Gemini API was unavailable.'
      const missingKey = /missing\s+vite_gemini_api_key/i.test(message)
      const fallbackSuffix = missingKey
        ? ' (Add VITE_GEMINI_API_KEY for full Gemini responses.)'
        : ' (Using a local fallback response.)'

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: `${fallback}${fallbackSuffix}`,
        },
      ])

      if (missingKey) {
        setError('Gemini API key is missing. Added a local fallback answer instead.')
      } else if (/quota|rate limit/i.test(message)) {
        setError('Gemini quota/rate limit reached. A local fallback answer was used.')
      } else {
        setError('Gemini API was unavailable, so a local fallback answer was used.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--accent)]">What-If Chatbot</p>
        <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
          Ask scenario questions and get bill outcomes from your own data.
        </h2>
        <div className="pill-accent mt-5 inline-flex px-4 py-2 text-sm">
          Advising based on your {formatCurrency(currentBill)} bill · {input.state} · {currentEntries.length} appliances
        </div>
      </section>

      <SectionCard
        eyebrow="Chat"
        title="Personalized What-If Assistant"
        description="The assistant receives your live bill, slab, appliance, and solar context on every message."
      >
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-wrap gap-2">
              {STARTER_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => void submitQuestion(chip)}
                  className="btn-secondary rounded-full px-4 py-2 text-sm"
                >
                  {chip}
                </button>
              ))}
            </div>
          ) : null}

          <div className="panel-elevated max-h-[520px] space-y-3 overflow-y-auto rounded-xl p-4">
            {messages.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                Ask a what-if question to model before-vs-after bill impact in rupees.
              </p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'ml-auto bg-[var(--accent)] text-white'
                      : 'mr-auto panel-surface text-[var(--text-primary)]'
                  }`}
                >
                  {message.role === 'assistant' ? renderHighlightedRupees(message.content) : message.content}
                </div>
              ))
            )}

            {loading ? (
              <div className="panel-surface mr-auto inline-flex items-center gap-2 rounded-2xl px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-[var(--text-secondary)] animate-pulse" />
                <span className="h-2 w-2 rounded-full bg-[var(--text-secondary)] animate-pulse [animation-delay:120ms]" />
                <span className="h-2 w-2 rounded-full bg-[var(--text-secondary)] animate-pulse [animation-delay:240ms]" />
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              void submitQuestion(draft)
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={loading}
              placeholder="Ask: what if I install 3kW solar panels?"
              className="input-base w-full disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="btn-primary rounded-lg px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>

          {error ? <p className="text-xs text-[var(--warning)]">{error}</p> : null}
        </div>
      </SectionCard>
    </div>
  )
}
