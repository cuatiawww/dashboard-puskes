import {
  createJsonResponse,
  getRuntimeEnv,
  postPsc119Dashboard,
} from '@/lib/psc119-dashboard'
import axios from 'axios'

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

type LegacyFeatureItem = {
  type?: string
  desc?: string
  iconUrl?: string
  iconSize?: [number, number] | number[]
  angle?: number | string | null
  coordinates?: Array<number | string>
  nama_psc?: string
  jenis_ambulance?: string
  nomor_kendaraan?: string
  petugas_ambulance?: string
  telp_petugas?: string
}

type LegacyCollectDataResponse = {
  features_ambulan?: LegacyFeatureItem[]
  features_tiket?: LegacyFeatureItem[]
}

type MergedFeatureAmbulan = {
  type: string
  desc: string
  iconUrl?: string
  iconSize?: [number, number]
  angle?: number | string | null
  nama_psc: string
  jenis_ambulance: string
  nomor_kendaraan: string
  petugas_ambulance: string
  telp_petugas: string
  coordinates?: [number, number]
}

const DEFAULT_COLLECT_DATA_BASE_URL = 'https://agdnusantara.jakarta.go.id/monitoring-base'
const DEFAULT_AMBULANCE_ICON_URL =
  'https://agdnusantara.jakarta.go.id/assets/icon/maps-icons/ambulan.png'
const DEFAULT_AMBULANCE_ICON_SIZE: [number, number] = [32, 32]

const cleanValue = (value?: string | number | null) => {
  const trimmed = String(value ?? '').trim()
  return trimmed && trimmed !== '-' ? trimmed : ''
}

const toCoordinate = (value?: string | number | null) => {
  const cleaned = cleanValue(value)
  if (!cleaned) return null

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeIconSize = (value?: [number, number] | number[]) => {
  if (!Array.isArray(value) || value.length < 2) return undefined

  const width = Number(value[0])
  const height = Number(value[1])

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return undefined
  }

  return [width, height] as [number, number]
}

const normalizeCoordinates = (value?: Array<number | string>) => {
  if (!Array.isArray(value) || value.length < 2) return undefined

  const lat = toCoordinate(value[0])
  const lng = toCoordinate(value[1])

  if (lat == null || lng == null) {
    return undefined
  }

  return [lat, lng] as [number, number]
}

const buildFeatureIdentity = (item: {
  type?: string
  nomor_kendaraan?: string
  nama_psc?: string
  coordinates?: Array<number | string>
}) => {
  const type = cleanValue(item.type)
  if (type) return `type:${type}`

  const nomorKendaraan = cleanValue(item.nomor_kendaraan)
  const namaPsc = cleanValue(item.nama_psc)
  if (nomorKendaraan || namaPsc) {
    return `meta:${nomorKendaraan}|${namaPsc}`.toUpperCase()
  }

  if (Array.isArray(item.coordinates) && item.coordinates.length === 2) {
    const lat = toCoordinate(item.coordinates[0])
    const lng = toCoordinate(item.coordinates[1])
    if (lat != null && lng != null) {
      return `coord:${lat.toFixed(6)}|${lng.toFixed(6)}`
    }
  }

  return ''
}

export async function GET() {
  return handleRequest({})
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { kode_provinsi?: string }
  return handleRequest({ kode_provinsi: body.kode_provinsi || '' })
}

async function handleRequest(payload: { kode_provinsi?: string }) {
  try {
    const [response, legacyCollectDataResponse] = await Promise.all([
      postPsc119Dashboard<SebaranPetaAmbulanResponse>('/dashboard/sebaran-peta-ambulan', {
        kode_provinsi: payload.kode_provinsi || '',
      }),
      loadLegacyCollectData(),
    ])

    const legacyMarkerTemplate = (legacyCollectDataResponse.features_ambulan || []).find(
      (item) => Boolean(cleanValue(item.iconUrl)),
    )
    const templateIconUrl =
      cleanValue(legacyMarkerTemplate?.iconUrl) || DEFAULT_AMBULANCE_ICON_URL
    const templateIconSize =
      normalizeIconSize(legacyMarkerTemplate?.iconSize) || DEFAULT_AMBULANCE_ICON_SIZE
    const templateAngle = legacyMarkerTemplate?.angle

    const officialFeaturesAmbulan: MergedFeatureAmbulan[] = (response.data || []).map((item, index) => {
      const latitude = toCoordinate(item.latitude)
      const longitude = toCoordinate(item.longitude)
      const nomorKendaraan = cleanValue(item.nomor_kendaraan)
      const namaPsc = cleanValue(item.nama_psc)
      const jenisAmbulance = cleanValue(item.jenis_ambulance)
      const petugas = cleanValue(item.petugas_ambulance)
      const telp = cleanValue(item.telp_petugas)

      return {
        type: [
          cleanValue(item.kode_psc),
          nomorKendaraan,
          String(index + 1),
        ]
          .filter(Boolean)
          .join('|'),
        desc: [namaPsc, jenisAmbulance].filter(Boolean).join(' | '),
        nama_psc: namaPsc,
        jenis_ambulance: jenisAmbulance,
        nomor_kendaraan: nomorKendaraan,
        petugas_ambulance: petugas,
        telp_petugas: telp,
        iconUrl: templateIconUrl || undefined,
        iconSize: templateIconSize,
        angle: templateAngle,
        coordinates:
          latitude != null && longitude != null ? [latitude, longitude] : undefined,
      }
    })

    const provinceCode = cleanValue(payload.kode_provinsi)
    const isJakartaRequest = provinceCode === '31'
    const isNationalRequest = !provinceCode
    const shouldUseLegacyAmbulanceFallback = isJakartaRequest || isNationalRequest

    const legacyFeaturesAmbulan = shouldUseLegacyAmbulanceFallback
      ? (legacyCollectDataResponse.features_ambulan || []).filter(
          (item) => Array.isArray(item.coordinates) && item.coordinates.length === 2,
        )
      : []

    const officialFeatureMap = new Map<string, MergedFeatureAmbulan>(
      officialFeaturesAmbulan.map((item) => [buildFeatureIdentity(item), item] as const),
    )

    const mergedFeaturesAmbulan: MergedFeatureAmbulan[] = [...officialFeaturesAmbulan]

    legacyFeaturesAmbulan.forEach((item, index) => {
      const normalizedLegacyItem: MergedFeatureAmbulan = {
        type:
          cleanValue(item.type) ||
          [cleanValue(item.nomor_kendaraan), cleanValue(item.nama_psc), `legacy-${index + 1}`]
            .filter(Boolean)
            .join('|'),
        desc: cleanValue(item.desc),
        iconUrl: cleanValue(item.iconUrl),
        iconSize: normalizeIconSize(item.iconSize),
        angle: item.angle,
        nama_psc: cleanValue(item.nama_psc),
        jenis_ambulance: cleanValue(item.jenis_ambulance),
        nomor_kendaraan: cleanValue(item.nomor_kendaraan),
        petugas_ambulance: cleanValue(item.petugas_ambulance),
        telp_petugas: cleanValue(item.telp_petugas),
        coordinates: normalizeCoordinates(item.coordinates),
      }

      const identity = buildFeatureIdentity(normalizedLegacyItem)
      const matchedOfficialItem = identity ? officialFeatureMap.get(identity) : undefined

      if (matchedOfficialItem) {
        if (normalizedLegacyItem.iconUrl) {
          matchedOfficialItem.iconUrl = normalizedLegacyItem.iconUrl
          matchedOfficialItem.iconSize = normalizedLegacyItem.iconSize
          matchedOfficialItem.angle = normalizedLegacyItem.angle
        }

        if (!matchedOfficialItem.desc && normalizedLegacyItem.desc) {
          matchedOfficialItem.desc = normalizedLegacyItem.desc
        }

        return
      }

      mergedFeaturesAmbulan.push(normalizedLegacyItem)
    })

    return createJsonResponse({
      sukses: response.sukses ?? 1,
      pesan: response.pesan || '',
      total_ambulan: response.total_ambulan ?? officialFeaturesAmbulan.length,
      total_ambulan_memiliki_gps: response.total_ambulan_memiliki_gps ?? 0,
      total_ambulan_memiliki_lokasi_terkahir:
        response.total_ambulan_memiliki_lokasi_terkahir ?? 0,
      features_ambulan: mergedFeaturesAmbulan,
      features_tiket: isJakartaRequest ? legacyCollectDataResponse.features_tiket || [] : [],
      items_ambulan: (response.data || []).map((item) => ({
        label: [cleanValue(item.nomor_kendaraan), cleanValue(item.nama_psc)]
          .filter(Boolean)
          .join(' - '),
        value: cleanValue(item.kode_psc) || cleanValue(item.nomor_kendaraan),
      })),
    })
  } catch (err) {
    return createJsonResponse(
      {
        error:
          (err as Error)?.message ||
          'Failed to fetch sebaran-peta-ambulan from PSC dashboard',
      },
      500,
    )
  }
}

async function loadLegacyCollectData(): Promise<LegacyCollectDataResponse> {
  const rawBaseUrl =
    getRuntimeEnv('NEXT_PUBLIC_PSC119_API_BASE_URL') || DEFAULT_COLLECT_DATA_BASE_URL
  const baseUrl = rawBaseUrl.replace(/\/+$/, '')

  try {
    const response = await axios.get<LegacyCollectDataResponse>(`${baseUrl}/collect_data`, {
      timeout: 15000,
    })

    return {
      features_ambulan: (response.data?.features_ambulan || []).filter(
        (item) => Array.isArray(item.coordinates) && item.coordinates.length === 2,
      ),
      features_tiket: (response.data?.features_tiket || []).filter(
        (item) => Array.isArray(item.coordinates) && item.coordinates.length === 2,
      ),
    }
  } catch {
    return { features_ambulan: [], features_tiket: [] }
  }
}
