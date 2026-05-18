import { NextResponse } from 'next/server'
import { fetchDashboardSebaranFaskes } from '@/lib/dashboard-faskes'

type RequestBody = {
  kode_provinsi?: string
  kode_kabupaten?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RequestBody
    const data = await fetchDashboardSebaranFaskes({
      kode_provinsi: body.kode_provinsi ?? '',
      kode_kabupaten: body.kode_kabupaten ?? '',
    })
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memuat sebaran faskes' },
      { status: 500 },
    )
  }
}

