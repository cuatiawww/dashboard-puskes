import { createJsonResponse, postPsc119DashboardForm } from '@/lib/psc119-dashboard'

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { tahun?: string | number }
    const tahun = String(body.tahun || new Date().getFullYear())
    const data = await postPsc119DashboardForm('/dashboard/rekap-realisasi-ambulan', {
      tahun,
    })

    return createJsonResponse(data)
  } catch (error) {
    return createJsonResponse(
      { error: (error as Error).message || 'Failed to fetch rekap-realisasi-ambulan' },
      500,
    )
  }
}
