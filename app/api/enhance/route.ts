import { GoogleGenAI } from '@google/genai'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const key = process.env.GEMINI_API_KEY
    if (!key) return Response.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 })
    const form = await request.formData()
    const image = form.get('image')
    const removeWatermark = form.get('removeWatermark') === 'true'
    if (!(image instanceof File)) return Response.json({ error: 'No image supplied.' }, { status: 400 })
    if (!image.type.startsWith('image/')) return Response.json({ error: 'Only image files are supported.' }, { status: 400 })

    const bytes = Buffer.from(await image.arrayBuffer())
    const ai = new GoogleGenAI({ apiKey: key })
    const prompt = removeWatermark
      ? 'Enhance this image and increase the resolution. Remove any visible watermark. Preserve the original subject, identity, composition, clothing, text, colors and natural photographic appearance. Do not invent or replace important details.'
      : 'Enhance this image and increase the resolution. Preserve the original subject, identity, composition, clothing, text, colors and natural photographic appearance. Do not invent or replace important details.'

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType: image.type, data: bytes.toString('base64') } }, { text: prompt }] }],
      config: { responseModalities: ['IMAGE'] }
    })

    const parts = response.candidates?.[0]?.content?.parts ?? []
    const output = parts.find((p: any) => p.inlineData?.data)
    if (!output?.inlineData?.data) return Response.json({ error: 'Gemini did not return an enhanced image.' }, { status: 502 })

    const mime = output.inlineData.mimeType || 'image/png'
    return new Response(Buffer.from(output.inlineData.data, 'base64'), {
      headers: { 'Content-Type': mime, 'Content-Disposition': `attachment; filename="enhanced-${image.name.replace(/"/g, '')}"`, 'Cache-Control': 'no-store' }
    })
  } catch (error) {
    console.error(error)
    return Response.json({ error: error instanceof Error ? error.message : 'Unexpected enhancement error.' }, { status: 500 })
  }
}
