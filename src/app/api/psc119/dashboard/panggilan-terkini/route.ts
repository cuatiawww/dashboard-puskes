import { createJsonResponse, postPsc119Dashboard } from '@/lib/psc119-dashboard'

type CallsRequestBody = {
  kode_provinsi?: string
}

type CallItem = {
  nama_provinsi?: string
  nama_psc?: string
  kode_psc?: string
  kode_ambulan?: string
  ticket_id?: string
  status?: string
  jenis_layanan?: string
  waktu_panggilan?: string
  petugas_panggilan?: string
  nama_pelapor?: string
  nama_korban?: string
  alamat?: string
  url_whatsapp?: string
  url_telp?: string
  url_dashboard?: string
  response_time?: string | number
}

type CallsResponse = {
  sukses?: number
  tgl_awal?: string
  tgl_akhir?: string
  data?: CallItem[]
}

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
  nama_psc?: string
}

type AmbulanceMapResponse = {
  sukses?: number
  data?: AmbulanceMapItem[]
}

const normalizeText = (value?: string) => String(value || '').trim().toUpperCase()

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as CallsRequestBody
    const requestBody = {
      kode_provinsi: body.kode_provinsi || '',
    }

    const [data, provinceResponse, ambulanceMapResponse] = await Promise.all([
      postPsc119Dashboard<CallsResponse>('/dashboard/panggilan-terkini', requestBody),
      postPsc119Dashboard<ProvinceResponse>('/dashboard/provinsi', {}),
      postPsc119Dashboard<AmbulanceMapResponse>('/dashboard/sebaran-peta-ambulan', requestBody),
    ])

    const provinceMap = new Map(
      (provinceResponse.data || []).map((item) => [
        String(item.kode_provinsi || '').trim(),
        String(item.nama_provinsi || '').trim(),
      ]),
    )

    const pscProvinceMap = new Map<string, string>()

    ;(ambulanceMapResponse.data || []).forEach((item) => {
      const pscCode = String(item.kode_psc || '').replace(/\D/g, '')
      const provinceCode = pscCode.slice(0, 2)
      const provinceName = provinceMap.get(provinceCode)
      const pscNameKey = normalizeText(item.nama_psc)

      if (provinceName && pscNameKey && !pscProvinceMap.has(pscNameKey)) {
        pscProvinceMap.set(pscNameKey, provinceName)
      }
    })

    const enrichedData = (data.data || []).map((item) => ({
      ...item,
      nama_provinsi:
        String(item.nama_provinsi || '').trim() ||
        pscProvinceMap.get(normalizeText(item.nama_psc)) ||
        '-',
    }))

    return createJsonResponse({
      ...data,
      data: enrichedData,
    })
  } catch (error) {
    return createJsonResponse(
      { error: (error as Error).message || 'Failed to fetch panggilan-terkini' },
      500,
    )
  }
}
