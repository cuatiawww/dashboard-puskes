const DASHBOARD_FASKES_BASE_URL =
  process.env.DASHBOARD_FASKES_BASE_URL ??
  'https://pusatkrisis.kemkes.go.id/sipkk-api'

const DASHBOARD_FASKES_TOKEN = process.env.DASHBOARD_FASKES_TOKEN

export type DashboardFaskesFilter = {
  kode_provinsi?: string
  kode_kabupaten?: string
}

export type DashboardProvinsiItem = {
  kode_provinsi: string
  nama_provinsi: string
}

export type DashboardKabupatenItem = {
  kode_kabupaten: string
  nama_kabupaten: string
}

export type DashboardRekapTotal = {
  total_rs: string | number
  total_puskesmas: string | number
  total_posyandu: string | number
  total_klinik: string | number
  total_pustu: string | number
  total_bkk: string | number
}

export type DashboardSebaranFaskesItem = {
  kode_provinsi?: string
  nama_provinsi?: string
  kode_kabupaten?: string
  nama_kabupaten?: string
  total_rs?: string | number
  total_puskesmas?: string | number
  total_pustu?: string | number
  total_klinik?: string | number
  total_posyandu?: string | number
  total_bkk?: string | number
}

type DashboardApiResponse<T> = {
  data?: T
}

function normalizeBaseUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

async function postDashboardEndpoint<T>(path: string, body: DashboardFaskesFilter = {}) {
  if (!DASHBOARD_FASKES_TOKEN) {
    throw new Error('DASHBOARD_FASKES_TOKEN belum diatur di environment variable')
  }

  const res = await fetch(`${normalizeBaseUrl(DASHBOARD_FASKES_BASE_URL)}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      TTOKEN: DASHBOARD_FASKES_TOKEN,
    },
    body: JSON.stringify({
      kode_provinsi: body.kode_provinsi ?? '',
      kode_kabupaten: body.kode_kabupaten ?? '',
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Gagal request ${path}. Status ${res.status}`)
  }

  return (await res.json()) as DashboardApiResponse<T>
}

export async function fetchDashboardProvinsi() {
  const response = await postDashboardEndpoint<DashboardProvinsiItem[]>(
    '/dashboard-faskes/provinsi',
  )
  return response.data ?? []
}

export async function fetchDashboardKabupaten(kodeProvinsi: string) {
  const response = await postDashboardEndpoint<DashboardKabupatenItem[]>(
    '/dashboard-faskes/kabupaten',
    { kode_provinsi: kodeProvinsi },
  )
  return response.data ?? []
}

export async function fetchDashboardRekapTotal(filter: DashboardFaskesFilter = {}) {
  const response = await postDashboardEndpoint<DashboardRekapTotal>(
    '/dashboard-faskes/rekap-total',
    filter,
  )
  return response.data ?? null
}

export async function fetchDashboardSebaranFaskes(filter: DashboardFaskesFilter = {}) {
  const response = await postDashboardEndpoint<DashboardSebaranFaskesItem[]>(
    '/dashboard-faskes/sebaran-faskes',
    filter,
  )
  return response.data ?? []
}
