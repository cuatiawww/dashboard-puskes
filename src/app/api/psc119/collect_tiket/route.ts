import axios from 'axios'

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_PSC119_API_BASE_URL 
    if (!baseUrl) {
      return new Response(
        JSON.stringify({ error: 'API base URL not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    const url = `${baseUrl}/collect_tiket`
    const response = await axios.get(url, {
      timeout: 5000,
    })

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const error = err instanceof axios.AxiosError ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: `Failed to fetch collect_tiket: ${error}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
