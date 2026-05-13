import { createJsonResponse, postPsc119Dashboard } from '@/lib/psc119-dashboard'

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { kode_provinsi?: string }
    const data = await postPsc119Dashboard('/dashboard/sebaran-ambulan-wilayah', {
      kode_provinsi: body.kode_provinsi || '',
    })

    return createJsonResponse(data)
  } catch (error) {
    return createJsonResponse(
      { error: (error as Error).message || 'Failed to fetch sebaran-ambulan-wilayah' },
      500,
    )
  }
}
