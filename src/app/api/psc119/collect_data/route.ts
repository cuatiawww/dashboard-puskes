import { createJsonResponse, postPsc119Dashboard } from '@/lib/psc119-dashboard'

type SebaranPetaAmbulanItem = {
  kode_psc?: string
  nama_psc?: string
  jenis_ambulance?: string
  nomor_kendaraan?: string
  petugas_ambulance?: string
  telp_petugas?: string
  latitude?: string
  longitude?: string
}

type SebaranPetaAmbulanResponse = {
  sukses?: number
  pesan?: string
  total_ambulan?: number
  total_ambulan_memiliki_gps?: number
  total_ambulan_memiliki_lokasi_terkahir?: number
  data?: SebaranPetaAmbulanItem[]
}

const cleanValue = (value?: string) => {
  const trimmed = (value || '').trim()
  return trimmed && trimmed !== '-' ? trimmed : ''
}

const toCoordinate = (value?: string) => {
  const cleaned = cleanValue(value)
  if (!cleaned) return null

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

export async function GET() {
  try {
    const response = await postPsc119Dashboard<SebaranPetaAmbulanResponse>(
      '/dashboard/sebaran-peta-ambulan',
      {},
    )

    const featuresAmbulan = (response.data || []).map((item, index) => {
      const latitude = toCoordinate(item.latitude)
      const longitude = toCoordinate(item.longitude)
      const nomorKendaraan = cleanValue(item.nomor_kendaraan)
      const namaPsc = cleanValue(item.nama_psc)
      const jenisAmbulance = cleanValue(item.jenis_ambulance)
      const petugas = cleanValue(item.petugas_ambulance)
      const telp = cleanValue(item.telp_petugas)

      const details = [
        nomorKendaraan,
        namaPsc,
        jenisAmbulance,
        petugas && `Petugas: ${petugas}`,
        telp && `Telp: ${telp}`,
      ].filter(Boolean)

      return {
        type: nomorKendaraan || item.kode_psc || `ambulance-${index + 1}`,
        desc: details.join(' | '),
        coordinates:
          latitude != null && longitude != null ? [latitude, longitude] : undefined,
      }
    })

    const adaptedResponse = {
      sukses: response.sukses ?? 1,
      pesan: response.pesan || '',
      total_ambulan: response.total_ambulan ?? featuresAmbulan.length,
      total_ambulan_memiliki_gps: response.total_ambulan_memiliki_gps ?? 0,
      total_ambulan_memiliki_lokasi_terkahir:
        response.total_ambulan_memiliki_lokasi_terkahir ?? 0,
      features_ambulan: featuresAmbulan,
      features_tiket: [],
      items_ambulan: (response.data || []).map((item) => ({
        label: [cleanValue(item.nomor_kendaraan), cleanValue(item.nama_psc)]
          .filter(Boolean)
          .join(' - '),
        value: cleanValue(item.kode_psc) || cleanValue(item.nomor_kendaraan),
      })),
    }

    return createJsonResponse(adaptedResponse)
  } catch (err) {
    return createJsonResponse(
      {
        error:
          (err as Error)?.message || 'Failed to fetch collect_data from PSC dashboard',
      },
      500,
    )
  }
}
