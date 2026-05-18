import { NextResponse } from 'next/server'
import { fetchDashboardProvinsi } from '@/lib/dashboard-faskes'

export async function POST() {
  try {
    const data = await fetchDashboardProvinsi()
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memuat data provinsi' },
      { status: 500 },
    )
  }
}

