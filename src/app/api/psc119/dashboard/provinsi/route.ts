import { createJsonResponse, postPsc119Dashboard } from '@/lib/psc119-dashboard'

export async function POST() {
  try {
    const data = await postPsc119Dashboard('/dashboard/provinsi', {})
    return createJsonResponse(data)
  } catch (error) {
    return createJsonResponse(
      { error: (error as Error).message || 'Failed to fetch provinsi' },
      500,
    )
  }
}
