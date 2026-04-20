import { BASE_CO2_PER_UNIT } from '../data/demo'
import type { SuggestionCard } from '../types'

type SuggestionContext = {
  bill: number
  city: string
  state: string
  appliances: Array<{
    id: string
    name: string
    hours: number
    perHourUnits: number
  }>
  tariffRateLabel: string
}

const systemPrompt =
  'You are an expert in Indian electricity tariffs. Always give actionable advice in rupees saved first, then units, then CO2. Be specific, local, and concise.'

function buildFallbackSuggestions(context: SuggestionContext): SuggestionCard[] {
  const approximateRate = Number(context.tariffRateLabel.replace('₹', '').replace(' slab', '')) || 4.5
  const rankedAppliances = [...context.appliances]
    .sort((left, right) => right.perHourUnits * right.hours - left.perHourUnits * left.hours)
    .slice(0, 3)

  const templates = [
    {
      effort: 'Easy' as const,
      reductionFactor: 0.2,
      titlePrefix: 'Trim runtime on',
      detailPrefix: 'Reduce the highest-load appliance first to get the fastest rupee savings.',
    },
    {
      effort: 'Easy' as const,
      reductionFactor: 0.15,
      titlePrefix: 'Shift usage for',
      detailPrefix: 'Move usage off peak hours or shorten each daily cycle a little.',
    },
    {
      effort: 'Medium' as const,
      reductionFactor: 0.1,
      titlePrefix: 'Optimize standby and cycles for',
      detailPrefix: 'Small reductions on recurring appliances add up over the billing month.',
    },
  ]

  return rankedAppliances.map((appliance, index) => {
    const template = templates[index] ?? templates[templates.length - 1]
    const hoursDelta = Number(Math.max(appliance.hours * template.reductionFactor, 0.25).toFixed(1))
    const units = hoursDelta * appliance.perHourUnits

    return {
      id: appliance.id,
      title: `${template.titlePrefix} ${appliance.name}`,
      savings: Math.round(units * approximateRate),
      units: Number(units.toFixed(1)),
      co2: Number((units * BASE_CO2_PER_UNIT).toFixed(1)),
      detail: `${template.detailPrefix} ${appliance.name.toLowerCase()} in ${context.city}, ${context.state}.`,
      applianceId: appliance.id,
      applianceName: appliance.name,
      hoursDelta,
      effort: template.effort,
      enabled: false,
    }
  })
}

function parseSuggestions(rawText: string): SuggestionCard[] {
  try {
    const parsed = JSON.parse(rawText) as { suggestions?: SuggestionCard[] }
    if (Array.isArray(parsed.suggestions) && parsed.suggestions.length) {
      return parsed.suggestions.map((item, index) => ({
        id: item.id || `ai-${index}`,
        title: item.title,
        savings: item.savings,
        units: item.units,
        co2: item.co2,
        detail: item.detail,
        applianceId: item.applianceId,
        applianceName: item.applianceName,
        hoursDelta: item.hoursDelta,
        effort: item.effort,
        enabled: false,
      }))
    }
  } catch {
    return []
  }

  return []
}

function normalizeSuggestions(
  suggestions: SuggestionCard[],
  allowedApplianceIds: Set<string>,
): SuggestionCard[] {
  return suggestions
    .filter((item) => {
      return (
        allowedApplianceIds.has(item.applianceId) &&
        Number.isFinite(item.hoursDelta) &&
        item.hoursDelta > 0
      )
    })
    .map((item, index) => ({
      ...item,
      id: item.id || `${item.applianceId}-${index}`,
      savings: Number.isFinite(item.savings) ? Math.max(item.savings, 0) : 0,
      units: Number.isFinite(item.units) ? Math.max(item.units, 0) : 0,
      co2: Number.isFinite(item.co2) ? Math.max(item.co2, 0) : 0,
    }))
}

export async function getAiSuggestions(context: SuggestionContext) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  const allowedApplianceIds = new Set(context.appliances.map((item) => item.id))

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return buildFallbackSuggestions(context)
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Bill: ₹${Math.round(context.bill)}, state: ${context.state}, city: ${context.city}. Appliances: ${context.appliances
            .map((item) => `${item.name} ${item.hours}h/day`)
            .join(', ')}. User is in ${context.tariffRateLabel}. Return JSON with key "suggestions" containing 3 cards. Each card needs id, title, savings, units, co2, detail, applianceId, applianceName, hoursDelta, effort.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    return buildFallbackSuggestions(context)
  }

  const payload = await response.json()
  const rawText = payload.choices?.[0]?.message?.content ?? ''
  const parsed = normalizeSuggestions(parseSuggestions(rawText), allowedApplianceIds)

  return parsed.length ? parsed.slice(0, 3) : buildFallbackSuggestions(context)
}
