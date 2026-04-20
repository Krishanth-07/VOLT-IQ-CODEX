export type WhatIfMessage = {
  role: 'user' | 'assistant'
  content: string
}

type AskGeminiParams = {
  systemPrompt: string
  conversationHistory: WhatIfMessage[]
}

type GeminiRole = 'user' | 'model'

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'] as const

type GeminiErrorPayload = {
  error?: {
    code?: number
    message?: string
    status?: string
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function requestGemini(
  model: string,
  apiKey: string,
  systemPrompt: string,
  conversationHistory: WhatIfMessage[],
) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.4,
        },
        contents: conversationHistory.map((message) => ({
          role: (message.role === 'assistant' ? 'model' : 'user') as GeminiRole,
          parts: [{ text: message.content }],
        })),
      }),
    },
  )
}

function getRetryAfterMs(response: Response) {
  const retryAfter = response.headers.get('retry-after')
  if (!retryAfter) return null

  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.round(seconds * 1000)
  }

  return null
}

function parseGeminiErrorPayload(errorText: string): GeminiErrorPayload {
  try {
    return JSON.parse(errorText) as GeminiErrorPayload
  } catch {
    return {}
  }
}

export async function askGeminiWhatIf({
  systemPrompt,
  conversationHistory,
}: AskGeminiParams): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY')
  }

  for (const model of GEMINI_MODELS) {
    let attempts = 0

    while (attempts < 3) {
      attempts += 1
      const response = await requestGemini(model, apiKey, systemPrompt, conversationHistory)

      if (response.ok) {
        const payload = (await response.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{ text?: string }>
            }
          }>
        }

        const text = payload.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? '')
          .join('')
          .trim()
        return text || 'I could not generate a response right now.'
      }

      const errorText = await response.text()
      const parsedError = parseGeminiErrorPayload(errorText)
      const errorMessage = parsedError.error?.message ?? errorText
      const isRateLimited = response.status === 429
      const isServerError = response.status >= 500
      const hasHardQuotaCap = /quota exceeded|limit:\s*0|billing/i.test(errorMessage)

      if ((isRateLimited || isServerError) && attempts < 3) {
        if (isRateLimited && hasHardQuotaCap) {
          throw new Error(
            'Gemini quota exceeded for this key/project (reported limit is 0). Check Google AI Studio project/quota settings or use another key.',
          )
        }

        const retryAfterMs = getRetryAfterMs(response)
        await sleep(retryAfterMs ?? 900 * attempts)
        continue
      }

      if (isRateLimited) {
        throw new Error('Gemini rate limit reached. Wait a moment and retry, or increase your quota limits.')
      }

      if (response.status === 404 || response.status === 400) {
        break
      }

      throw new Error(errorMessage || 'Gemini API request failed')
    }
  }

  throw new Error('No available Gemini model could serve this request.')
}
