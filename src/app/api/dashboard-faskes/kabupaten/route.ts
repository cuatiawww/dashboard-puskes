import { NextResponse } from 'next/server'
import { fetchDashboardKabupaten } from '@/lib/dashboard-faskes'

type RequestBody = {
  kode_provinsi?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RequestBody
    const data = await fetchDashboardKabupaten(body.kode_provinsi ?? '')
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memuat data kabupaten/kota' },
      { status: 500 },
    )
  }
}

