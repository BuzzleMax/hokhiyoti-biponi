export interface Env {
  BREVO_API_KEY: string
  BREVO_LIST_ID: string
  GEMINI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

interface NewsletterRequest {
  email: string
}

interface ChatRequest {
  message: string
  history: Array<{ sender: 'ai' | 'customer'; text: string }>
  currentPage?: string
  preferredLanguage?: string
}

const ipRateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60000
const MAX_REQUESTS_PER_WINDOW = 20

// Gemini API Configuration
// gemini-2.5-flash:      404 — not available to new users on this key
// gemini-2.0-flash:      429 — project-level limit = 0 (no free allocation)
// gemini-2.0-flash-lite: shut down June 1 2026 per Google announcement
// gemini-3.1-flash-lite: official replacement — current, lower cost, function calling supported
const GEMINI_API_VERSION = 'v1beta'
const GEMINI_MODEL = 'models/gemini-3.1-flash-lite'

// 15 Specific Tool Definitions for the AI Agent
const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'search_products',
        description: 'Query database for products using general criteria (query keyword, category, collection, fabric, colour, size, limit).',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Search term keyword' },
            category: { type: 'STRING', description: 'Category filter (e.g. Mekhela Chador)' },
            collection: { type: 'STRING', description: 'Collection filter (e.g. Bihu)' },
            fabric: { type: 'STRING', description: 'Fabric filter (e.g. Muga)' },
            colour: { type: 'STRING', description: 'Color filter' },
            size: { type: 'STRING', description: 'Size filter' },
            limit: { type: 'NUMBER', description: 'Maximum products to return (default 5)' }
          }
        }
      },
      {
        name: 'compare_products',
        description: 'Compare multiple products using their product IDs or names.',
        parameters: {
          type: 'OBJECT',
          properties: {
            product_ids: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Array of product UUIDs or names to compare'
            }
          },
          required: ['product_ids']
        }
      },
      {
        name: 'search_categories',
        description: 'List available product categories in Hokhiyoti Biponi.',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'search_collections',
        description: 'List available product collections in Hokhiyoti Biponi.',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'search_reviews',
        description: 'Retrieve user reviews and ratings for a product ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            product_id: { type: 'STRING', description: 'Product UUID' }
          },
          required: ['product_id']
        }
      },
      {
        name: 'search_shipping',
        description: 'Get shipping and delivery policy details for a product ID or general delivery.',
        parameters: {
          type: 'OBJECT',
          properties: {
            product_id: { type: 'STRING', description: 'Product UUID (optional)' }
          }
        }
      },
      {
        name: 'search_return_policy',
        description: 'Get return, exchange, or refund policy for a product ID or general policy.',
        parameters: {
          type: 'OBJECT',
          properties: {
            product_id: { type: 'STRING', description: 'Product UUID (optional)' }
          }
        }
      },
      {
        name: 'search_product_details',
        description: 'Retrieve deep specifications of a single product using its product ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            product_id: { type: 'STRING', description: 'Product UUID' }
          },
          required: ['product_id']
        }
      },
      {
        name: 'search_by_price',
        description: 'Retrieve products within a specific price range (min to max).',
        parameters: {
          type: 'OBJECT',
          properties: {
            max_price: { type: 'NUMBER', description: 'Maximum price limit' },
            min_price: { type: 'NUMBER', description: 'Minimum price limit' }
          },
          required: ['max_price']
        }
      },
      {
        name: 'search_by_colour',
        description: 'Filter products by color name.',
        parameters: {
          type: 'OBJECT',
          properties: {
            colour: { type: 'STRING', description: 'Color name' }
          },
          required: ['colour']
        }
      },
      {
        name: 'search_by_size',
        description: 'Filter products by size code (e.g., S, M, L, XL).',
        parameters: {
          type: 'OBJECT',
          properties: {
            size: { type: 'STRING', description: 'Size code' }
          },
          required: ['size']
        }
      },
      {
        name: 'search_by_fabric',
        description: 'Filter products by fabric type (e.g. Muga, Pat, Eri).',
        parameters: {
          type: 'OBJECT',
          properties: {
            fabric: { type: 'STRING', description: 'Fabric name' }
          },
          required: ['fabric']
        }
      },
      {
        name: 'search_new_arrivals',
        description: 'Retrieve the newest product arrivals.',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'search_best_sellers',
        description: 'Retrieve the best-selling products.',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'search_featured',
        description: 'Retrieve featured products.',
        parameters: { type: 'OBJECT', properties: {} }
      }
    ]
  }
]

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return handleCORS()

    const url = new URL(request.url)

    if (request.method === 'POST' && url.pathname === '/newsletter') {
      return handleNewsletter(request, env)
    }

    if (request.method === 'POST' && url.pathname === '/api/chat') {
      return handleChat(request, env)
    }

    if (request.method === 'GET' && url.pathname === '/api/debug/gemini-models') {
      return handleDebugGeminiModels(env)
    }

    return new Response('Not found', { status: 404 })
  }
}

// ─── DEBUG: List available Gemini models and probe candidates ────────────────
async function handleDebugGeminiModels(env: Env): Promise<Response> {
  const safeKey = env.GEMINI_API_KEY
    ? `...${env.GEMINI_API_KEY.slice(-6)}`
    : '(missing)'

  // Step 1: Call ListModels
  let allModels: any[] = []
  let listError: string | null = null
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models?key=${env.GEMINI_API_KEY}`,
      { headers: { 'Content-Type': 'application/json' } }
    )
    if (listRes.ok) {
      const listJson: any = await listRes.json()
      allModels = listJson.models || []
    } else {
      listError = `ListModels HTTP ${listRes.status}: ${await listRes.text()}`
    }
  } catch (e: any) {
    listError = `ListModels fetch error: ${e.message}`
  }

  // Step 2: Filter to models that support generateContent
  const generateContentModels = allModels
    .filter((m: any) =>
      Array.isArray(m.supportedGenerationMethods) &&
      m.supportedGenerationMethods.includes('generateContent')
    )
    .map((m: any) => ({
      name: m.name,
      displayName: m.displayName || '',
      description: (m.description || '').slice(0, 120),
      supportedMethods: m.supportedGenerationMethods
    }))

  // Step 3: Probe candidate models in preference order with a minimal generateContent
  const candidatePreference = [
    'models/gemini-3.1-flash-lite',
    'models/gemini-3.1-flash-lite-preview',
    'models/gemini-3.5-flash-lite',
    'models/gemini-3.5-flash',
    'models/gemini-3.6-flash',
    'models/gemini-3.0-flash',
    'models/gemini-flash-latest',
    'models/gemini-2.0-flash',
  ]

  // Only probe models that are in the list returned by ListModels
  const availableNames = new Set(allModels.map((m: any) => m.name))
  const candidates = candidatePreference.filter(c => availableNames.has(c))

  const probeResults: any[] = []
  let selectedModel: string | null = null

  for (const modelName of candidates) {
    const probePayload = {
      contents: [{ role: 'user', parts: [{ text: 'Reply with the single word: OK' }] }],
      generationConfig: { maxOutputTokens: 10, temperature: 0 }
    }
    let probeStatus = 0
    let probeError: string | null = null
    let probeReply: string | null = null
    try {
      const probeRes = await fetch(
        `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/${modelName}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(probePayload)
        }
      )
      probeStatus = probeRes.status
      if (probeRes.ok) {
        const probeJson: any = await probeRes.json()
        probeReply = probeJson.candidates?.[0]?.content?.parts?.[0]?.text || '(no text)'
        if (!selectedModel) selectedModel = modelName
      } else {
        const errBody = await probeRes.text()
        // Sanitize: remove any key that might have leaked into error body
        probeError = errBody
          .replace(/key=[^&"\s]+/gi, 'key=REDACTED')
          .slice(0, 400)
      }
    } catch (e: any) {
      probeStatus = 0
      probeError = `fetch error: ${e.message}`
    }
    probeResults.push({
      model: modelName,
      httpStatus: probeStatus,
      reply: probeReply,
      error: probeError
    })
    // Stop probing once we have a working model
    if (probeStatus === 200) break
  }

  return jsonResponse({
    apiKeyLastSix: safeKey,
    listModelsError: listError,
    totalModelsReturned: allModels.length,
    generateContentCapableCount: generateContentModels.length,
    generateContentModels,
    candidatesProbed: probeResults,
    selectedModel: selectedModel || '(none found)',
    activeWorkerModel: GEMINI_MODEL,
    geminiApiVersion: GEMINI_API_VERSION
  }, 200)
}

// Newsletter Handler
async function handleNewsletter(request: Request, env: Env): Promise<Response> {
  try {
    const body: NewsletterRequest = await request.json()
    if (!body.email || typeof body.email !== 'string') {
      return jsonResponse({ success: false, error: 'Email is required' }, 400)
    }
    const email = body.email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return jsonResponse({ success: false, error: 'Invalid email format' }, 400)
    }

    if (!env.BREVO_API_KEY || !env.BREVO_LIST_ID) {
      return jsonResponse({ success: false, error: 'Server configuration error' }, 500)
    }

    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        listIds: [Number(env.BREVO_LIST_ID)],
        updateEnabled: false,
      }),
    })

    if (brevoResponse.status === 201 || brevoResponse.status === 204) {
      return jsonResponse({ success: true }, 200)
    }
    return jsonResponse({ success: false, error: 'Failed to subscribe' }, 500)
  } catch (error) {
    return jsonResponse({ success: false, error: 'Invalid request' }, 400)
  }
}

// Chat Agent Handler
async function handleChat(request: Request, env: Env): Promise<Response> {
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'

  // Rate Limiting
  if (clientIP !== 'unknown') {
    const now = Date.now()
    const record = ipRateLimitMap.get(clientIP)
    if (record) {
      if (now > record.resetTime) {
        ipRateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
      } else {
        record.count++
        if (record.count > MAX_REQUESTS_PER_WINDOW) {
          return jsonResponse({ success: false, error: 'Too many requests. Please slow down.' }, 429)
        }
      }
    } else {
      ipRateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    }
  }

  try {
    const body: ChatRequest = await request.json()
    if (!body.message || typeof body.message !== 'string') {
      return jsonResponse({ success: false, error: 'Message content is required' }, 400)
    }

    const sanitizedMessage = sanitizeInput(body.message)

    // ─── DEBUG STAGE 1: Request received ───────────────────────────────────────
    console.log('\n════════════════════════════════════════════════════')
    console.log('[DEBUG STAGE 1] REQUEST RECEIVED')
    console.log('[DEBUG 1] User message     :', sanitizedMessage)
    console.log('[DEBUG 1] Preferred lang   :', body.preferredLanguage || '(not set, defaulting to English)')
    console.log('[DEBUG 1] History length   :', Array.isArray(body.history) ? body.history.length : 0, 'messages')
    console.log('[DEBUG 1] Current page     :', body.currentPage || '(not set)')
    console.log('[DEBUG 1] Client IP        :', clientIP)
    console.log('════════════════════════════════════════════════════')

    const sanitizedLang = sanitizeInput(body.preferredLanguage || 'English')
    const sanitizedPage = sanitizeInput(body.currentPage || 'Homepage')

    // ─── DEBUG STAGE 2: Environment variable check ─────────────────────────────
    console.log('\n[DEBUG STAGE 2] ENVIRONMENT CHECK')
    console.log('[DEBUG 2] GEMINI_API_KEY present   :', Boolean(env.GEMINI_API_KEY))
    console.log('[DEBUG 2] SUPABASE_URL present     :', Boolean(env.SUPABASE_URL))
    console.log('[DEBUG 2] SUPABASE_ANON_KEY present:', Boolean(env.SUPABASE_ANON_KEY))
    console.log('[DEBUG 2] BREVO_API_KEY present    :', Boolean(env.BREVO_API_KEY))
    console.log('[DEBUG 2] BREVO_LIST_ID present    :', Boolean(env.BREVO_LIST_ID))

    if (!env.GEMINI_API_KEY || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      console.error('[DEBUG 2] ❌ CRITICAL: One or more required env vars are MISSING. Returning 500.')
      console.error('[DEBUG 2]   GEMINI_API_KEY :', Boolean(env.GEMINI_API_KEY))
      console.error('[DEBUG 2]   SUPABASE_URL   :', Boolean(env.SUPABASE_URL))
      console.error('[DEBUG 2]   SUPABASE_ANON_KEY:', Boolean(env.SUPABASE_ANON_KEY))
      return jsonResponse({ success: false, error: 'Server variables configuration error' }, 500)
    }
    console.log('[DEBUG 2] ✅ All required env vars present. Proceeding.')

    // Strict Agent System Prompt
    const systemPrompt = `You are the "✨ Hokhiyoti AI Stylist", a premium, elite human Assamese luxury fashion consultant and stylist.
Your goal is to guide clients visiting the Hokhiyoti Biponi online store.

CRITICAL RULES:
1. You MUST NEVER answer product, price, color, fabric, category, or collection questions using your own knowledge. You MUST ALWAYS call one of the search/lookup tools.
2. You MUST NEVER invent or hallucinate products, prices, colors, availability status, ratings, reviews, or shipping details.
3. If the search query yields NO results, say: "I couldn't find an exact match. Here are the closest products." and then list the alternative products returned in the database context.
4. When writing your final stylist reply, explain *WHY* each product matches. Write in an elegant, friendly, and professional tone.
5. Provide a maximum of 5 recommendations.
6. The customer is currently viewing: "${sanitizedPage}".
7. Respond in: "${sanitizedLang}" (e.g. Assamese or English).
8. NEVER mention "Gemini", "AI", "Supabase", "database", "worker", "tool", "API", or any technical implementation detail. Always talk as a human stylist who has just checked the store's physical inventory registers.`

    // Mapping History with Automatic Summarization if length > 20
    const contents: any[] = []
    let activeHistory = body.history || []

    if (activeHistory.length > 20) {
      const boundaryIndex = activeHistory.length - 15
      const toSummarize = activeHistory.slice(0, boundaryIndex)
      const recentHistory = activeHistory.slice(boundaryIndex)

      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`
        const summarizePayload = {
          contents: [
            {
              role: 'user',
              parts: [{
                text: `Summarize the following exchange between a customer and Hokhiyoti AI Stylist into a single concise paragraph. Focus on user preferences, budget constraints, fabrics, and colors discussed:\n\n${toSummarize.map(m => `${m.sender === 'customer' ? 'Customer' : 'Stylist'}: ${m.text}`).join('\n')}`
              }]
            }
          ],
          generationConfig: { maxOutputTokens: 200 }
        }

        const sumRes = await fetchWithTimeout(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(summarizePayload)
        })

        if (sumRes.ok) {
          const sumJson: any = await sumRes.json()
          const summaryText = sumJson.candidates?.[0]?.content?.parts?.[0]?.text || ''
          
          if (summaryText.trim()) {
            contents.push({
              role: 'user',
              parts: [{ text: `[System Context - Summary of earlier conversation: ${summaryText.trim()}]` }]
            })
            contents.push({
              role: 'model',
              parts: [{ text: `Understood. I will remember these preferences and keep this context in mind for our luxury styling session.` }]
            })
          }
        }
      } catch (sumErr) {
        console.error('[Worker] History summarization failed, continuing with sliced history:', sumErr)
      }

      activeHistory = recentHistory
    }

    activeHistory.forEach(msg => {
      contents.push({
        role: msg.sender === 'customer' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })
    })

    contents.push({
      role: 'user',
      parts: [{ text: sanitizedMessage }]
    })

    const geminiUrl = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`

    // 1. Initial Gemini call requesting Tool Call
    const initialPayload = {
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      tools: GEMINI_TOOLS,
      generationConfig: { temperature: 0.1 }
    }

    // ─── DEBUG STAGE 3: Gemini Call #1 ────────────────────────────────────────
    console.log('\n[DEBUG STAGE 3] GEMINI CALL #1 — Initial tool-request call')
    console.log('[DEBUG 3] Model            :', GEMINI_MODEL)
    console.log('[DEBUG 3] Contents turns   :', contents.length, 'turns in context')
    console.log('[DEBUG 3] Tools provided   :', GEMINI_TOOLS[0].functionDeclarations.length, 'tools')
    console.log('[DEBUG 3] Temperature      : 0.1')
    console.log('[DEBUG 3] Request body (no key):', JSON.stringify({
      contentsLength: contents.length,
      systemInstructionLength: systemPrompt.length,
      toolCount: GEMINI_TOOLS[0].functionDeclarations.length,
      generationConfig: initialPayload.generationConfig
    }))
    console.log('[DEBUG 3] Sending Gemini Call #1...')

    const response1 = await fetchWithTimeout(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialPayload)
    })

    console.log('[DEBUG 3] Gemini Call #1 HTTP status:', response1.status, response1.statusText)

    if (!response1.ok) {
      const errText = await response1.text()
      console.error('[DEBUG 3] ❌ Gemini Call #1 FAILED')
      console.error('[DEBUG 3] Status         :', response1.status, response1.statusText)
      console.error('[DEBUG 3] Error body     :', errText)
      throw new Error(`Gemini initial call failed: ${errText}`)
    }

    const resJson1: any = await response1.json()

    // ─── DEBUG STAGE 4: Tool Detection (from Gemini Call #1 response) ──────────
    console.log('\n[DEBUG STAGE 4] TOOL DETECTION — Parsing Gemini Call #1 response')
    console.log('[DEBUG 4] Full Gemini Call #1 response:', JSON.stringify(resJson1, null, 2))

    const firstCandidate = resJson1.candidates?.[0]
    const functionCalls = firstCandidate?.content?.parts?.filter((p: any) => p.functionCall) || []

    console.log('[DEBUG 4] Finish reason    :', firstCandidate?.finishReason || '(none)')
    console.log('[DEBUG 4] Parts count      :', firstCandidate?.content?.parts?.length ?? 0)
    console.log('[DEBUG 4] Tool calls found :', functionCalls.length)

    if (functionCalls.length > 0) {
      functionCalls.forEach((fc: any, i: number) => {
        console.log(`[DEBUG 4] Tool call [${i}] name :`, fc.functionCall?.name)
        console.log(`[DEBUG 4] Tool call [${i}] args :`, JSON.stringify(fc.functionCall?.args))
      })
    } else {
      console.log('[DEBUG 4] ⚠️  Gemini did NOT request a tool on Call #1.')
      console.log('[DEBUG 4]   finishReason:', firstCandidate?.finishReason)
      console.log('[DEBUG 4]   text reply  :', firstCandidate?.content?.parts?.[0]?.text?.slice(0, 200) || '(empty)')
      console.log('[DEBUG 4]   Will check hasProductQuery next to attempt forced tool call.')
    }

    let matchedProducts: any[] = []
    let totalMatchingCount = 0
    let isFallback = false

    // 2. Process tool calls if any
    if (functionCalls.length > 0) {
      const toolCallParts = firstCandidate.content.parts
      const toolResponses: any[] = []

      for (const part of toolCallParts) {
        if (part.functionCall) {
          const { name, args } = part.functionCall
          console.log('[STEP 3] Gemini called tool: ' + name + ' with args:', JSON.stringify(args))
          let toolResult: any = null

          try {
            const dbResult = await executeTool(name, args, env)
            toolResult = dbResult.data
            
            // Capture matching products
            if (dbResult.products) {
              matchedProducts = dbResult.products
              totalMatchingCount = dbResult.totalCount || 0
            }

            // Fallback checking: If no exact products are returned for queries
            const isProductTool = ['search_products', 'compare_products', 'search_similar_products', 'search_by_price', 'search_by_colour', 'search_by_size', 'search_by_fabric', 'search_new_arrivals', 'search_best_sellers', 'search_featured'].includes(name)
            if (isProductTool && matchedProducts.length === 0) {
              isFallback = true
              const fallbackDb = await executeTool('search_featured', {}, env)
              matchedProducts = fallbackDb.products || []
              totalMatchingCount = fallbackDb.totalCount || 0
              toolResult = {
                note: "No exact matches found in database. The assistant MUST output exactly: 'I couldn't find an exact match. Here are the closest available products.' before introducing these fallback options.",
                fallback_products: fallbackDb.data
              }
            }
          } catch (e: any) {
            console.error('[DEBUG 5] ❌ executeTool() threw an exception for tool:', name)
            console.error('[DEBUG 5] Error message:', e.message)
            console.error('[DEBUG 5] Error stack  :', e.stack)
            toolResult = { error: e.message || 'Database query error' }
          }

          toolResponses.push({
            functionResponse: {
              name,
              response: { result: toolResult }
            }
          })
        }
      }

      const followUpContents = [
        ...contents,
        {
          role: 'model',
          parts: toolCallParts
        },
        {
          role: 'user',
          parts: toolResponses
        }
      ]

      const followUpPayload = {
        contents: followUpContents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        tools: GEMINI_TOOLS,
        generationConfig: { temperature: 0.1 }
      }

      // ─── DEBUG STAGE 6: Gemini Call #2 ──────────────────────────────────────
      console.log('\n[DEBUG STAGE 6] GEMINI CALL #2 — Follow-up with tool results')
      console.log('[DEBUG 6] Tool responses being sent back:', JSON.stringify(toolResponses, null, 2))
      console.log('[STEP 6] Payload sent back to Gemini:', JSON.stringify(toolResponses, null, 2))
      console.log('[DEBUG 6] Follow-up contents turns   :', followUpContents.length)
      console.log('[DEBUG 6] isFallback flag             :', isFallback)
      console.log('[DEBUG 6] matchedProducts count       :', matchedProducts.length)
      console.log('[DEBUG 6] Sending Gemini Call #2...')

      const response2 = await fetchWithTimeout(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followUpPayload)
      })

      console.log('[DEBUG 6] Gemini Call #2 HTTP status:', response2.status, response2.statusText)

      if (!response2.ok) {
        const errText2 = await response2.text()
        console.error('[DEBUG 6] ❌ Gemini Call #2 FAILED')
        console.error('[DEBUG 6] Status      :', response2.status, response2.statusText)
        console.error('[DEBUG 6] Error body  :', errText2)
        throw new Error(`Gemini follow-up call failed: ${errText2}`)
      }

      const resJson2: any = await response2.json()
      console.log('[DEBUG 6] Full Gemini Call #2 response:', JSON.stringify(resJson2, null, 2))

      let finalReply = resJson2.candidates?.[0]?.content?.parts?.[0]?.text || ''
      console.log('[STEP 7] Gemini final formatted response:', finalReply)

      // ─── DEBUG STAGE 7: Final Response ──────────────────────────────────────
      console.log('\n[DEBUG STAGE 7] FINAL RESPONSE (normal tool path)')
      console.log('[DEBUG 7] Final reply text (first 300 chars):', finalReply.slice(0, 300))
      console.log('[DEBUG 7] Products returned                 :', matchedProducts.length)
      console.log('[DEBUG 7] totalMatchingCount                :', totalMatchingCount)
      console.log('[DEBUG 7] isFallback                        :', isFallback)

      if (isFallback && !finalReply.toLowerCase().includes("couldn't find an exact match")) {
        finalReply = `I couldn't find an exact match. Here are the closest available products.\n\n${finalReply}`
      }

      return jsonResponse({
        success: true,
        text: finalReply,
        products: matchedProducts,
        totalMatchingCount: totalMatchingCount
      }, 200)
    }

    // Force tool calling if it tried to bypass tools
    const productKeywords = ['mekhela', 'chador', 'saree', 'price', 'bihu', 'wedding', 'pat', 'muga', 'eri', 'silk', 'designer', 'blouse', 'jewellery', 'jewelry', 'recommend', 'buy', 'product', 'arrival', 'seller', 'featured']
    const hasProductQuery = productKeywords.some(keyword => sanitizedMessage.toLowerCase().includes(keyword))
    console.log('[STEP 2] Detected Intent (hasProductQuery):', hasProductQuery)
    console.log('[DEBUG 4b] Matched keyword :', productKeywords.find(k => sanitizedMessage.toLowerCase().includes(k)) || '(none)')

    if (hasProductQuery) {
      const forcedPayload = {
        ...initialPayload,
        toolConfig: {
          functionCallingConfig: {
            mode: 'ANY',
            allowedFunctionNames: ['search_products']
          }
        }
      }

      console.log('\n[DEBUG 3b] GEMINI FORCED CALL — mode: ANY, allowedFunctionNames: [search_products]')
      console.log('[DEBUG 3b] Sending forced Gemini call...')

      const forceRes = await fetchWithTimeout(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forcedPayload)
      })

      console.log('[DEBUG 3b] Forced Gemini call HTTP status:', forceRes.status, forceRes.statusText)

      if (forceRes.ok) {
        const forceJson: any = await forceRes.json()
        console.log('[DEBUG 3b] Full forced Gemini response:', JSON.stringify(forceJson, null, 2))

        const forceCandidate = forceJson.candidates?.[0]
        const forceCalls = forceCandidate?.content?.parts?.filter((p: any) => p.functionCall) || []

        console.log('[DEBUG 3b] Forced tool calls found:', forceCalls.length)
        if (forceCalls.length === 0) {
          console.warn('[DEBUG 3b] ⚠️  Even forced call returned no tool calls. finishReason:', forceCandidate?.finishReason)
        }

        if (forceCalls.length > 0) {
          const toolCallParts = forceCandidate.content.parts
          const toolResponses: any[] = []

          for (const part of toolCallParts) {
            if (part.functionCall) {
              const { name, args } = part.functionCall
              console.log('[STEP 3 - Forced] Gemini called tool: ' + name + ' with args:', JSON.stringify(args))
              const dbResult = await executeTool(name, args, env)
              matchedProducts = dbResult.products || []
              totalMatchingCount = dbResult.totalCount || 0

              if (matchedProducts.length === 0) {
                isFallback = true
                const fallbackDb = await executeTool('search_featured', {}, env)
                matchedProducts = fallbackDb.products || []
                totalMatchingCount = fallbackDb.totalCount || 0
                toolResponses.push({
                  functionResponse: {
                    name,
                    response: {
                      result: {
                        note: "No exact matches found. Start with: 'I couldn't find an exact match. Here are the closest available products.'",
                        fallback_products: fallbackDb.data
                      }
                    }
                  }
                })
              } else {
                toolResponses.push({
                  functionResponse: {
                    name,
                    response: { result: dbResult.data }
                  }
                })
              }
            }
          }

          const followUpPayload = {
            contents: [
              ...contents,
              { role: 'model', parts: toolCallParts },
              { role: 'user', parts: toolResponses }
            ],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            tools: GEMINI_TOOLS,
            generationConfig: { temperature: 0.1 }
          }

          // ─── DEBUG STAGE 6 (Forced path) ──────────────────────────────────
          console.log('\n[DEBUG STAGE 6 - Forced] GEMINI CALL #2 (Forced path) — Follow-up with tool results')
          console.log('[DEBUG 6F] Tool responses being sent back:', JSON.stringify(toolResponses, null, 2))
          console.log('[STEP 6 - Forced] Payload sent back to Gemini:', JSON.stringify(toolResponses, null, 2))
          console.log('[DEBUG 6F] isFallback    :', isFallback)
          console.log('[DEBUG 6F] matchedProducts count:', matchedProducts.length)

          const response2 = await fetchWithTimeout(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(followUpPayload)
          })

          console.log('[DEBUG 6F] Gemini Call #2 (Forced) HTTP status:', response2.status, response2.statusText)

          if (response2.ok) {
            const resJson2: any = await response2.json()
            console.log('[DEBUG 6F] Full Gemini Call #2 (Forced) response:', JSON.stringify(resJson2, null, 2))

            let finalReply = resJson2.candidates?.[0]?.content?.parts?.[0]?.text || ''
            console.log('[STEP 7 - Forced] Gemini final formatted response:', finalReply)

            // ─── DEBUG STAGE 7 (Forced path) ────────────────────────────────
            console.log('\n[DEBUG STAGE 7 - Forced] FINAL RESPONSE (forced tool path)')
            console.log('[DEBUG 7F] Final reply text (first 300 chars):', finalReply.slice(0, 300))
            console.log('[DEBUG 7F] Products returned                 :', matchedProducts.length)
            console.log('[DEBUG 7F] totalMatchingCount                :', totalMatchingCount)
            console.log('[DEBUG 7F] isFallback                        :', isFallback)

            if (isFallback && !finalReply.toLowerCase().includes("couldn't find an exact match")) {
              finalReply = `I couldn't find an exact match. Here are the closest available products.\n\n${finalReply}`
            }
            return jsonResponse({
              success: true,
              text: finalReply,
              products: matchedProducts,
              totalMatchingCount: totalMatchingCount
            }, 200)
          } else {
            console.error('[DEBUG 6F] ❌ Gemini Call #2 (Forced) returned non-ok status:', response2.status, response2.statusText)
          }
        }
      } else {
        console.error('[DEBUG 3b] ❌ Forced Gemini call itself returned non-ok status:', forceRes.status, forceRes.statusText)
        try {
          const forceErrBody = await forceRes.text()
          console.error('[DEBUG 3b] Forced call error body:', forceErrBody)
        } catch (_) {}
      }
    }

    const replyText = firstCandidate?.content?.parts?.[0]?.text || ''

    // ─── DEBUG STAGE 7: Final Response (non-tool path) ──────────────────────
    console.log('\n[DEBUG STAGE 7] FINAL RESPONSE (no-tool / conversational path)')
    console.log('[DEBUG 7] No tool was called and no forced call succeeded.')
    console.log('[DEBUG 7] Returning text from Gemini Call #1 directly.')
    console.log('[DEBUG 7] Final reply text (first 300 chars):', replyText.slice(0, 300) || '(empty — no text in response)')
    console.log('[DEBUG 7] Products returned: 0')

    return jsonResponse({
      success: true,
      text: replyText,
      products: [],
      totalMatchingCount: 0
    }, 200)

  } catch (error: any) {
    // ─── DEBUG STAGE 8: Top-level catch ─────────────────────────────────────
    console.error('\n[DEBUG STAGE 8] ❌ TOP-LEVEL CATCH in handleChat()')
    console.error('[DEBUG 8] Error message:', error?.message)
    console.error('[DEBUG 8] Error stack  :', error?.stack)
    console.error('[DEBUG 8] Full error   :', error)
    console.error('[Worker] Chat agent handler error:', error)
    return jsonResponse({
      success: false,
      error: 'Apologies, our product database is temporarily offline. Please check with your stylist again shortly.'
    }, 500)
  }
}

// Executes database tool operations against Supabase PostgREST endpoints
async function executeTool(name: string, args: any, env: Env): Promise<{ data: any; products?: any[]; totalCount?: number }> {
  // ─── DEBUG STAGE 5: executeTool() entry ──────────────────────────────────
  console.log('\n[DEBUG STAGE 5] executeTool() CALLED')
  console.log('[DEBUG 5] Tool name  :', name)
  console.log('[DEBUG 5] Tool args  :', JSON.stringify(args))
  console.log('[DEBUG 5] Supabase URL (base):', env.SUPABASE_URL)
  console.log('[STEP 4] Connecting to Supabase for tool: ' + name)

  const supabaseHeaders = {
    'apikey': env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'count=exact'
  }

  const baseUrl = env.SUPABASE_URL

  switch (name) {
    case 'search_products': {
      let params = 'select=*&active=eq.true'

      if (args.query) {
        const q = encodeURIComponent(args.query)
        params += `&or=(name.ilike.*${q}*,description.ilike.*${q}*)`
      }

      if (args.category) {
        const cat = encodeURIComponent(args.category)
        params += `&or=(category_name.ilike.*${cat}*,category_slug.eq.${cat})`
      }
      if (args.collection) {
        const col = encodeURIComponent(args.collection)
        params += `&or=(collection_name.ilike.*${col}*,collection_slug.eq.${col})`
      }
      if (args.fabric) {
        params += `&fabric=ilike.*${encodeURIComponent(args.fabric)}*`
      }
      if (args.colour) {
        params += `&colors=cs.{${encodeURIComponent(args.colour)}}`
      }
      if (args.size) {
        params += `&sizes=cs.{${encodeURIComponent(args.size)}}`
      }

      const limitNum = args.limit || 5
      params += `&limit=${limitNum}`
      params += '&order=rating.desc,featured.desc,sold_count.desc,created_at.desc'

      console.log('[STEP 5] search_products generated query params: ' + params)

      const url = `${baseUrl}/rest/v1/products?${params}`
      console.log('[DEBUG 5] search_products full Supabase URL:', url)

      const response = await fetch(url, { headers: supabaseHeaders })

      console.log('[STEP 5] Supabase response status:', response.status, response.statusText)

      if (!response.ok) {
        const errBody = await response.text()
        console.error('[DEBUG 5] ❌ Supabase search_products FAILED')
        console.error('[DEBUG 5] Status    :', response.status, response.statusText)
        console.error('[DEBUG 5] Error body:', errBody)
        throw new Error(`Supabase search failed: ${response.statusText}`)
      }

      const rawProducts: any[] = await response.json()

      console.log('[STEP 5] Rows returned:', rawProducts.length)
      console.log('[DEBUG 5] search_products raw JSON (first 2 rows):', JSON.stringify(rawProducts.slice(0, 2), null, 2))

      const formatted = mapProducts(rawProducts)
      console.log('[DEBUG 5] search_products formatted products count:', formatted.length)

      return {
        data: formatted,
        products: formatted,
        totalCount: formatted.length
      }
    }

    case 'compare_products': {
      const ids: string[] = Array.isArray(args.product_ids) ? args.product_ids : []
      if (ids.length === 0) {
        console.warn('[DEBUG 5] compare_products: product_ids array is empty, returning empty.')
        return { data: [], products: [], totalCount: 0 }
      }

      const orClauses = ids.map(id => {
        const clean = encodeURIComponent(id)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        return isUuid ? `id.eq.${clean}` : `name.ilike.*${clean}*`
      }).join(',')

      const url = `${baseUrl}/rest/v1/products?select=*&or=(${orClauses})&active=eq.true`
      console.log('[DEBUG 5] compare_products full Supabase URL:', url)

      const response = await fetch(url, { headers: supabaseHeaders })
      console.log('[DEBUG 5] compare_products Supabase status:', response.status, response.statusText)

      if (!response.ok) {
        const errBody = await response.text()
        console.error('[DEBUG 5] ❌ compare_products Supabase FAILED:', errBody)
        throw new Error(`Supabase compare query failed: ${response.statusText}`)
      }

      const rawProducts: any[] = await response.json()
      console.log('[DEBUG 5] compare_products rows returned:', rawProducts.length)
      const formatted = mapProducts(rawProducts)

      return {
        data: formatted,
        products: formatted,
        totalCount: formatted.length
      }
    }

    case 'search_categories': {
      const url = `${baseUrl}/rest/v1/categories?select=name,slug,description&active=eq.true`
      console.log('[DEBUG 5] search_categories URL:', url)
      const response = await fetch(url, { headers: supabaseHeaders })
      console.log('[DEBUG 5] search_categories status:', response.status, response.statusText)
      const data = await response.json()
      console.log('[DEBUG 5] search_categories returned:', JSON.stringify(data))
      return { data }
    }

    case 'search_collections': {
      const url = `${baseUrl}/rest/v1/collections?select=name,slug,description`
      console.log('[DEBUG 5] search_collections URL:', url)
      const response = await fetch(url, { headers: supabaseHeaders })
      console.log('[DEBUG 5] search_collections status:', response.status, response.statusText)
      const data = await response.json()
      console.log('[DEBUG 5] search_collections returned:', JSON.stringify(data))
      return { data }
    }

    case 'search_reviews': {
      const pId = encodeURIComponent(args.product_id || '')
      const url = `${baseUrl}/rest/v1/product_reviews?select=customer_name,rating,title,comment&product_id=eq.${pId}&is_approved=eq.true`
      console.log('[DEBUG 5] search_reviews URL:', url)
      const response = await fetch(url, { headers: supabaseHeaders })
      console.log('[DEBUG 5] search_reviews status:', response.status, response.statusText)
      const data = await response.json()
      console.log('[DEBUG 5] search_reviews returned:', JSON.stringify(data))
      return { data }
    }

    case 'search_shipping': {
      const pId = args.product_id ? encodeURIComponent(args.product_id) : null
      const select = pId ? `select=name,shipping_info&id=eq.${pId}` : 'select=name,shipping_info'
      const url = `${baseUrl}/rest/v1/products?${select}&active=eq.true`
      console.log('[DEBUG 5] search_shipping URL:', url)
      const response = await fetch(url, { headers: supabaseHeaders })
      console.log('[DEBUG 5] search_shipping status:', response.status, response.statusText)
      const data = await response.json()
      console.log('[DEBUG 5] search_shipping returned:', JSON.stringify(data))
      return { data }
    }

    case 'search_return_policy': {
      const pId = args.product_id ? encodeURIComponent(args.product_id) : null
      const select = pId ? `select=name,return_policy&id=eq.${pId}` : 'select=name,return_policy'
      const url = `${baseUrl}/rest/v1/products?${select}&active=eq.true`
      console.log('[DEBUG 5] search_return_policy URL:', url)
      const response = await fetch(url, { headers: supabaseHeaders })
      console.log('[DEBUG 5] search_return_policy status:', response.status, response.statusText)
      const data = await response.json()
      console.log('[DEBUG 5] search_return_policy returned:', JSON.stringify(data))
      return { data }
    }

    case 'search_product_details': {
      const pId = encodeURIComponent(args.product_id || '')
      const url = `${baseUrl}/rest/v1/products?select=id,name,description,fabric,care_instructions,shipping_info,return_policy,highlights,price,colors,sizes,rating,availability_status&id=eq.${pId}`
      console.log('[DEBUG 5] search_product_details URL:', url)
      const response = await fetch(url, { headers: supabaseHeaders })
      console.log('[DEBUG 5] search_product_details status:', response.status, response.statusText)
      const data = await response.json()
      console.log('[DEBUG 5] search_product_details returned:', JSON.stringify(data))
      return { data }
    }

    case 'search_by_price': {
      let params = 'select=*&active=eq.true'
      if (args.min_price !== undefined) params += `&price=gte.${args.min_price}`
      if (args.max_price !== undefined) params += `&price=lte.${args.max_price}`

      const url = `${baseUrl}/rest/v1/products?${params}&limit=10&order=rating.desc,featured.desc,sold_count.desc,created_at.desc`
      console.log('[DEBUG 5] search_by_price URL:', url)

      const response = await fetch(url, { headers: supabaseHeaders })
      console.log('[DEBUG 5] search_by_price status:', response.status, response.statusText)

      const rawProducts: any[] = await response.json()
      console.log('[DEBUG 5] search_by_price rows returned:', rawProducts.length)

      const formatted = mapProducts(rawProducts)

      return {
        data: formatted,
        products: formatted,
        totalCount: formatted.length
      }
    }

    case 'search_by_colour': {
      const url = `${baseUrl}/rest/v1/products?select=*&colors=cs.{${encodeURIComponent(args.colour)}}&active=eq.true&limit=10&order=rating.desc,featured.desc,sold_count.desc,created_at.desc`
      console.log('[DEBUG 5] search_by_colour URL:', url)
      const response = await fetch(url, { headers: supabaseHeaders })
      console.log('[DEBUG 5] search_by_colour status:', response.status, response.statusText)
      const rawProducts: any[] = await response.json()
      console.log('[DEBUG 5] search_by_colour rows returned:', rawProducts.length)
      const formatted = mapProducts(rawProducts)

      return {
        data: formatted,
        products: formatted,
        totalCount: formatted.length
      }
    }

    case 'search_by_size': {
      const url = `${baseUrl}/rest/v1/products?select=*&sizes=cs.{${encodeURIComponent(args.size)}}&active=eq.true&limit=10&order=rating.desc,featured.desc,sold_count.desc,created_at.desc`
      console.log('[DEBUG 5] search_by_size URL:', url)
      const response = await fetch(url, { headers: supabaseHeaders })
      console.log('[DEBUG 5] search_by_size status:', response.status, response.statusText)
      const rawProducts: any[] = await response.json()
      console.log('[DEBUG 5] search_by_size rows returned:', rawProducts.length)
      const formatted = mapProducts(rawProducts)

      return {
        data: formatted,
        products: formatted,
        totalCount: formatted.length
      }
    }

    case 'search_by_fabric': {
      const url = `${baseUrl}/rest/v1/products?select=*&fabric=ilike.*${encodeURIComponent(args.fabric)}*&active=eq.true&limit=10&order=rating.desc,featured.desc,sold_count.desc,created_at.desc`
      console.log('[DEBUG 5] search_by_fabric URL:', url)
      const response = await fetch(url, { headers: supabaseHeaders })
      console.log('[DEBUG 5] search_by_fabric status:', response.status, response.statusText)
      const rawProducts: any[] = await response.json()
      console.log('[DEBUG 5] search_by_fabric rows returned:', rawProducts.length)
      const formatted = mapProducts(rawProducts)

      return {
        data: formatted,
        products: formatted,
        totalCount: formatted.length
      }
    }

    case 'search_new_arrivals': {
      const url = `${baseUrl}/rest/v1/products?select=*&new_arrival=eq.true&active=eq.true&limit=10&order=created_at.desc,rating.desc`
      console.log('[DEBUG 5] search_new_arrivals URL:', url)
      const response = await fetch(url, { headers: supabaseHeaders })
      console.log('[DEBUG 5] search_new_arrivals status:', response.status, response.statusText)
      const rawProducts: any[] = await response.json()
      console.log('[DEBUG 5] search_new_arrivals rows returned:', rawProducts.length)
      const formatted = mapProducts(rawProducts)

      return {
        data: formatted,
        products: formatted,
        totalCount: formatted.length
      }
    }

    case 'search_best_sellers': {
      const url = `${baseUrl}/rest/v1/products?select=*&best_seller=eq.true&active=eq.true&limit=10&order=sold_count.desc,rating.desc`
      console.log('[DEBUG 5] search_best_sellers URL:', url)
      const response = await fetch(url, { headers: supabaseHeaders })
      console.log('[DEBUG 5] search_best_sellers status:', response.status, response.statusText)
      const rawProducts: any[] = await response.json()
      console.log('[DEBUG 5] search_best_sellers rows returned:', rawProducts.length)
      const formatted = mapProducts(rawProducts)

      return {
        data: formatted,
        products: formatted,
        totalCount: formatted.length
      }
    }

    case 'search_featured': {
      const url = `${baseUrl}/rest/v1/products?select=*&featured=eq.true&active=eq.true&limit=10&order=rating.desc,sold_count.desc`
      console.log('[DEBUG 5] search_featured URL:', url)
      const response = await fetch(url, { headers: supabaseHeaders })
      console.log('[DEBUG 5] search_featured status:', response.status, response.statusText)
      const rawProducts: any[] = await response.json()
      console.log('[DEBUG 5] search_featured rows returned:', rawProducts.length)
      const formatted = mapProducts(rawProducts)

      return {
        data: formatted,
        products: formatted,
        totalCount: formatted.length
      }
    }

    case 'search_similar_products': {
      const pId = encodeURIComponent(args.product_id || '')
      const detailUrl = `${baseUrl}/rest/v1/products?select=category_id,collection_id&id=eq.${pId}`
      const detailResponse = await fetch(detailUrl, { headers: supabaseHeaders })
      const details: any[] = await detailResponse.json()
      
      if (details.length === 0) return { data: [], products: [], totalCount: 0 }
      const catId = details[0].category_id
      const colId = details[0].collection_id

      let query = `select=*&id=neq.${pId}&active=eq.true`
      if (catId) query += `&category_id=eq.${catId}`
      else if (colId) query += `&collection_id=eq.${colId}`

      const url = `${baseUrl}/rest/v1/products?${query}&limit=10`
      const response = await fetch(url, { headers: supabaseHeaders })
      const rawProducts: any[] = await response.json()
      const formatted = mapProducts(rawProducts)

      return {
        data: formatted,
        products: formatted,
        totalCount: formatted.length
      }
    }

    case 'search_colours': {
      const url = `${baseUrl}/rest/v1/products?select=colors&active=eq.true`
      const response = await fetch(url, { headers: supabaseHeaders })
      const productsList: any[] = await response.json()
      const allColors = new Set<string>()
      productsList.forEach(p => {
        if (Array.isArray(p.colors)) {
          p.colors.forEach((c: string) => allColors.add(c))
        }
      })
      return { data: Array.from(allColors) }
    }

    case 'search_sizes': {
      const url = `${baseUrl}/rest/v1/products?select=sizes&active=eq.true`
      const response = await fetch(url, { headers: supabaseHeaders })
      const productsList: any[] = await response.json()
      const allSizes = new Set<string>()
      productsList.forEach(p => {
        if (Array.isArray(p.sizes)) {
          p.sizes.forEach((s: string) => allSizes.add(s))
        }
      })
      return { data: Array.from(allSizes) }
    }

    default:
      console.error('[DEBUG 5] ❌ Unknown tool requested:', name)
      throw new Error(`Tool ${name} is not supported.`)
  }
}

function mapProducts(rawProducts: any[]): any[] {
  return rawProducts.map(p => {
    let coverImage = ''
    if (Array.isArray(p.images) && p.images.length > 0) {
      const first = p.images[0]
      coverImage = typeof first === 'string' ? first : first.url || ''
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price) || 0,
      image: coverImage,
      rating: Number(p.rating) || 0,
      highlights: Array.isArray(p.highlights) ? p.highlights : [],
      availability: p.availability_status || 'in_stock',
      category: p.category_name || ''
    }
  })
}

async function fetchWithTimeout(resource: string, options: any = {}): Promise<Response> {
  const { timeout = 10000 } = options
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  })
  clearTimeout(id)
  return response
}

function sanitizeInput(val: string): string {
  if (typeof val !== 'string') return ''
  return val
    .replace(/<script[^>]*>([\S\s]*?)<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .trim()
}

function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

function jsonResponse(data: any, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
