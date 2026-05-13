import { createJsonResponse, postPsc119Dashboard } from '@/lib/psc119-dashboard'

type ProvinceItem = {
  kode_provinsi?: string
  nama_provinsi?: string
}

type ProvinceResponse = {
  sukses?: number
  data?: ProvinceItem[]
}

type AmbulanceMapItem = {
  kode_psc?: string
}

type AmbulanceMapResponse = {
  sukses?: number
  data?: AmbulanceMapItem[]
}

type CallItem = {
  nama_provinsi?: string
}

type CallsResponse = {
  sukses?: number
  data?: CallItem[]
}

export async function GET() {
  try {
    const [provinceResponse, mapResponse, callsResponse] = await Promise.all([
      postPsc119Dashboard<ProvinceResponse>('/dashboard/provinsi', {}),
      postPsc119Dashboard<AmbulanceMapResponse>('/dashboard/sebaran-peta-ambulan', {
        kode_provinsi: '',
      }),
      postPsc119Dashboard<CallsResponse>('/dashboard/panggilan-terkini', {
        kode_provinsi: '',
      }),
    ])

    const provinceMap = new Map(
      (provinceResponse.data || []).map((item) => [
        String(item.kode_provinsi || '').trim(),
        String(item.nama_provinsi || '').trim(),
      ]),
    )

    const aggregate = new Map<
      string,
      { provinceName: string; totalAmbulance: number; uniquePscCodes: Set<string> }
    >()

    ;(mapResponse.data || []).forEach((item) => {
      const code = String(item.kode_psc || '').replace(/\D/g, '')
      const provinceCode = code.slice(0, 2)
      if (!provinceCode) return

      const provinceName = provinceMap.get(provinceCode)
      if (!provinceName) return

      const current = aggregate.get(provinceCode) || {
        provinceName,
        totalAmbulance: 0,
        uniquePscCodes: new Set<string>(),
      }

      current.totalAmbulance += 1

      if (item.kode_psc) {
        current.uniquePscCodes.add(String(item.kode_psc).trim())
      }

      aggregate.set(provinceCode, current)
    })

    const activeByProvince = new Map<string, number>()

    ;(callsResponse.data || []).forEach((item) => {
      const provinceName = String(item.nama_provinsi || '').trim().toUpperCase()
      if (!provinceName) return

      activeByProvince.set(provinceName, (activeByProvince.get(provinceName) || 0) + 1)
    })

    const summaryRows = Array.from(aggregate.values())
      .map((item) => ({
        provinceName: item.provinceName,
        totalAmbulance: item.totalAmbulance,
        totalPsc: item.uniquePscCodes.size,
        activeCount: activeByProvince.get(item.provinceName.toUpperCase()) || 0,
      }))
      .sort((a, b) => b.totalAmbulance - a.totalAmbulance)

    const top5 = <T,>(items: T[], sorter: (a: T, b: T) => number) =>
      [...items].sort(sorter).slice(0, 5)

    return createJsonResponse({
      totalPscByProvince: top5(summaryRows, (a, b) => b.totalPsc - a.totalPsc),
      totalAmbulanceByProvince: top5(
        summaryRows,
        (a, b) => b.totalAmbulance - a.totalAmbulance,
      ),
      onDutyByProvince: top5(summaryRows, (a, b) => b.activeCount - a.activeCount).map(
        (item) => ({
          provinceName: item.provinceName,
          totalActive: item.activeCount,
        }),
      ),
      standbyByProvince: top5(
        summaryRows.map((item) => ({
          provinceName: item.provinceName,
          totalStandby: Math.max(item.totalAmbulance - item.activeCount, 0),
        })),
        (a, b) => b.totalStandby - a.totalStandby,
      ),
    })
  } catch (error) {
    return createJsonResponse(
      { error: (error as Error).message || 'Failed to build summary popup data' },
      500,
    )
  }
}
