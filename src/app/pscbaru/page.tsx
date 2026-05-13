'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const IndonesiaMapPlaceholder = dynamic(
  () => import('@/components/psc119/IndonesiaMapPlaceholder'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[720px] items-center justify-center rounded-[24px] bg-[#abd7e8] text-sm font-semibold text-slate-500">
        Memuat peta provinsi...
      </div>
    ),
  },
)

type ToneKey = 'rose' | 'amber' | 'sky' | 'cyan'

type SummaryCardTemplate = {
  key: string
  title: string
  tone: ToneKey
  iconSrc: string
  iconAlt: string
}

type SummaryCardData = SummaryCardTemplate & {
  value: string
  delta: string
  baseline: string
}

type ProvinceItem = {
  kode_provinsi?: string
  nama_provinsi?: string
  kode?: string
  nama?: string
}

type ProvinceResponse = {
  sukses?: number
  data?: ProvinceItem[]
}

type SummaryResponse = {
  psc?: {
    total?: number
    tahun_sebelumnya?: number
    total_psc_tahun_lalu?: number
    persentase?: number
  }
  ambulan?: {
    total_gadar?: number
    total_transport?: number
  }
  ambulan_on_duty?: {
    hari_ini?: number
    kemarin?: number
    persentase?: number
  }
  ambulan_standby?: {
    hari_ini?: number
    kemarin?: number
    persentase?: number
  }
  permintaan_ambulan?: {
    hari_ini?: number
    kemarin?: number
    persentase?: number
    status?: string
  }
  ambulan_respon?: {
    jumlah_permintaan?: number
    jumlah_diproses?: number
    jumlah_terlayani?: number
    jumlah_pending?: number
    persentase_respon?: number
    persentase_terlayani?: number
    persentase_pending?: number
  }
  panggilan_emergency?: {
    total_panggilan_emergency_hari_ini?: number
    total_panggilan_emergency_kemarin?: number
    persentase_emergency?: number
    status_panggilan_emergency?: string
  } | unknown[]
  petugas?:
    | Array<unknown>
    | {
        total?: number
        total_petugas_ambulan_hari_ini?: number
        total_petugas_ambulan_kemarin?: number
        persentase_petugas?: number
        status_petugas?: string
      }
}

type RegionItem = {
  nama_kabupaten?: string
  nama_psc?: string
  jumlah_ambulan_gadar?: number
  jumlah_ambulan_transport?: number
}

type RegionResponse = {
  data?: {
    kabupaten?: RegionItem[]
    psc?: RegionItem[]
  }
}

type CallRow = {
  nama_psc?: string
  nama_provinsi?: string
  waktu_panggilan?: string
  nama_pelapor?: string
  kode_ambulan?: string
  ticket_id?: string
  response_time?: string | number
  status?: string
}

type CallsResponse = {
  tgl_awal?: string
  tgl_akhir?: string
  data?: CallRow[]
}

type SebaranPanggilanItem = {
  bulan?: string
  nama_bulan?: string
  month?: string
  label?: string
  total_data?: number | string
  permintaan?: number | string
  jumlah_permintaan?: number | string
  jml_permintaan?: number | string
  total_permintaan?: number | string
  mobilisasi?: number | string
  jumlah_mobilisasi?: number | string
  jml_mobilisasi?: number | string
  total_mobilisasi?: number | string
  terlayani?: number | string
}

type SebaranPanggilanResponse = {
  sukses?: number
  data?: SebaranPanggilanItem[] | Record<string, unknown>
} & Record<string, unknown>

type MapAmbulanceItem = {
  petugas_ambulance?: string
  nama_psc?: string
  latitude?: string
  longitude?: string
}

type MapAmbulanceResponse = {
  sukses?: number
  total_ambulan?: number
  total_ambulan_memiliki_gps?: number
  total_ambulan_memiliki_lokasi_terkahir?: number
  features_ambulan?: MapAmbulanceItem[]
}

type ProvinceOption = {
  value: string
  label: string
}

type WilayahChartRow = {
  name: string
  gadar: number
  transport: number
}

type PanggilanChartRow = {
  label: string
  permintaan: number
  mobilisasi: number
  sortKey: number
}

const summaryCardTemplates: SummaryCardTemplate[] = [
  {
    key: 'psc',
    title: 'Total PSC 119 Provinsi',
    tone: 'rose',
    iconSrc: '/card/psc.svg',
    iconAlt: 'Total PSC 119',
  },
  {
    key: 'ambulance',
    title: 'Total Ambulan PSC 119 Provinsi',
    tone: 'amber',
    iconSrc: '/card/tot-ambulan-psc.svg',
    iconAlt: 'Total ambulan PSC 119',
  },
  {
    key: 'staff',
    title: 'Total Petugas Ambulan Provinsi',
    tone: 'sky',
    iconSrc: '/card/maintain.svg',
    iconAlt: 'Total petugas ambulan',
  },
  {
    key: 'emergency',
    title: 'Total Panggilan Emergency Prov.',
    tone: 'cyan',
    iconSrc: '/card/maintain.svg',
    iconAlt: 'Total panggilan emergency',
  },
  {
    key: 'onduty',
    title: 'Total Ambulan Onduty Provinsi',
    tone: 'rose',
    iconSrc: '/card/tot-ambulan.svg',
    iconAlt: 'Total ambulan on duty',
  },
  {
    key: 'idle',
    title: 'Total Ambulan Idle Provinsi',
    tone: 'amber',
    iconSrc: '/card/ambulan.svg',
    iconAlt: 'Total ambulan idle',
  },
]

const toneClasses = {
  rose: {
    card: 'border-rose-200 bg-rose-50/80',
    title: 'text-rose-500',
    value: 'text-rose-600',
    iconWrap: 'bg-rose-100 text-rose-500',
  },
  amber: {
    card: 'border-amber-200 bg-amber-50/80',
    title: 'text-amber-500',
    value: 'text-amber-600',
    iconWrap: 'bg-amber-100 text-amber-500',
  },
  sky: {
    card: 'border-cyan-200 bg-cyan-50/80',
    title: 'text-cyan-600',
    value: 'text-cyan-700',
    iconWrap: 'bg-cyan-100 text-cyan-600',
  },
  cyan: {
    card: 'border-cyan-200 bg-cyan-50/80',
    title: 'text-cyan-600',
    value: 'text-cyan-700',
    iconWrap: 'bg-cyan-100 text-cyan-600',
  },
} as const

const formatNumber = (value?: number) => Number(value ?? 0).toLocaleString('id-ID')

const formatSignedPercent = (value?: number) => {
  const amount = Number(value ?? 0)
  return `${amount > 0 ? '+' : ''}${amount.toLocaleString('id-ID', {
    maximumFractionDigits: 2,
  })}%`
}

const formatTrendDelta = (
  value?: number,
  {
    positiveLabel = 'Naik',
    negativeLabel = 'Turun',
    zeroLabel = 'Tetap',
  }: {
    positiveLabel?: string
    negativeLabel?: string
    zeroLabel?: string
  } = {},
) => {
  const amount = Number(value ?? 0)

  if (amount > 0) {
    return `${positiveLabel} ${formatSignedPercent(amount)}`
  }

  if (amount < 0) {
    return `${negativeLabel} ${formatSignedPercent(amount)}`
  }

  return `${zeroLabel} ${formatSignedPercent(amount)}`
}

const formatShortProvinceName = (label: string) => {
  const normalized = label.trim()
  if (!normalized) return 'Semua Provinsi'
  if (normalized.toUpperCase() === 'DKI JAKARTA') return 'DKI Jakarta'
  return normalized
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const toSafeNumber = (value?: string | number | null) => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const getPetugasTotal = (source?: SummaryResponse['petugas']) => {
  if (Array.isArray(source)) return source.length
  if (source && typeof source === 'object' && 'total' in source) {
    return toSafeNumber(source.total as number)
  }
  if (source && typeof source === 'object' && 'total_petugas_ambulan_hari_ini' in source) {
    return toSafeNumber(source.total_petugas_ambulan_hari_ini as number)
  }
  return 0
}

const getPetugasBaseline = (source?: SummaryResponse['petugas']) => {
  if (source && typeof source === 'object' && 'total_petugas_ambulan_kemarin' in source) {
    return toSafeNumber(source.total_petugas_ambulan_kemarin as number)
  }
  return 0
}

const getPetugasDelta = (source?: SummaryResponse['petugas']) => {
  if (source && typeof source === 'object' && 'persentase_petugas' in source) {
    return formatTrendDelta(source.persentase_petugas as number)
  }
  return 'Data Petugas'
}

const getEmergencyCount = (source?: SummaryResponse['panggilan_emergency']) => {
  if (Array.isArray(source)) return source.length
  if (source && typeof source === 'object' && 'total_panggilan_emergency_hari_ini' in source) {
    return toSafeNumber(source.total_panggilan_emergency_hari_ini as number)
  }
  return 0
}

const getEmergencyBaseline = (source?: SummaryResponse['panggilan_emergency']) => {
  if (source && typeof source === 'object' && 'total_panggilan_emergency_kemarin' in source) {
    return toSafeNumber(source.total_panggilan_emergency_kemarin as number)
  }
  return 0
}

const getEmergencyDelta = (source?: SummaryResponse['panggilan_emergency']) => {
  if (source && typeof source === 'object' && 'persentase_emergency' in source) {
    return formatTrendDelta(source.persentase_emergency as number)
  }
  return 'Data Emergency'
}

const getUniquePetugasCount = (rows?: MapAmbulanceItem[]) => {
  const unique = new Set(
    (rows || [])
      .map((item) => String(item.petugas_ambulance || '').trim().toUpperCase())
      .filter(Boolean),
  )

  return unique.size
}

const getProvinceItemLabel = (item: ProvinceItem) =>
  String(item.nama_provinsi || item.nama || '').trim()

const getProvinceItemValue = (item: ProvinceItem) =>
  String(item.kode_provinsi || item.kode || '').trim()

const toTitleCaseLabel = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const parseCallDate = (value?: string) => {
  const raw = String(value || '').trim()
  if (!raw) return null

  const direct = new Date(raw)
  if (!Number.isNaN(direct.getTime())) return direct

  const normalized = raw.replace(/\bWIB\b/gi, '').trim()
  const retry = new Date(normalized)
  if (!Number.isNaN(retry.getTime())) return retry

  return null
}

const getCallGroupKey = (value?: string, index = 0) => {
  const parsed = parseCallDate(value)
  if (parsed) {
    return {
      key: parsed.toISOString().slice(0, 10),
      label: parsed.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      }),
      sortKey: parsed.getTime(),
    }
  }

  const fallback = String(value || '').trim()
  return {
    key: fallback || `item-${index}`,
    label: fallback ? fallback.slice(0, 10) : `Data ${index + 1}`,
    sortKey: index,
  }
}

const isMobilizedCall = (row: CallRow) => {
  const status = String(row.status || '').trim().toLowerCase()
  if (status.includes('pending')) return false
  if (status.includes('diproses')) return true
  if (status.includes('layani')) return true
  if (status.includes('selesai')) return true

  const responseText = String(row.response_time ?? '').trim()
  return responseText !== '' && responseText !== '-' && responseText !== '0'
}

const buildCallSeries = (rows: CallRow[]) => {
  const grouped = new Map<string, PanggilanChartRow>()

  rows.forEach((row, index) => {
    const meta = getCallGroupKey(row.waktu_panggilan, index)
    const current = grouped.get(meta.key) || {
      label: meta.label,
      permintaan: 0,
      mobilisasi: 0,
      sortKey: meta.sortKey,
    }

    current.permintaan += 1
    if (isMobilizedCall(row)) {
      current.mobilisasi += 1
    }

    grouped.set(meta.key, current)
  })

  const result = Array.from(grouped.values()).sort((a, b) => a.sortKey - b.sortKey)
  return result.slice(-7)
}

const monthOrderMap = new Map([
  ['JAN', 1],
  ['JANUARI', 1],
  ['FEB', 2],
  ['FEBRUARI', 2],
  ['MAR', 3],
  ['MARET', 3],
  ['APR', 4],
  ['APRIL', 4],
  ['MEI', 5],
  ['MAY', 5],
  ['JUN', 6],
  ['JUNI', 6],
  ['JUL', 7],
  ['JULI', 7],
  ['AGU', 8],
  ['AGUSTUS', 8],
  ['AUG', 8],
  ['SEP', 9],
  ['SEPT', 9],
  ['SEPTEMBER', 9],
  ['OKT', 10],
  ['OKTOBER', 10],
  ['OCT', 10],
  ['NOV', 11],
  ['NOVEMBER', 11],
  ['DES', 12],
  ['DESEMBER', 12],
  ['DEC', 12],
])

const normalizeMonthLabel = (value: string) => {
  const raw = value.trim()
  if (!raw) return ''
  const upper = raw.toUpperCase()
  return upper.charAt(0) + upper.slice(1, 3).toLowerCase()
}

const getMonthSortKey = (item: SebaranPanggilanItem, index: number) => {
  const numericMonth = toSafeNumber(item.bulan || item.month)
  if (numericMonth > 0) return numericMonth

  const text = String(item.nama_bulan || item.label || '').trim().toUpperCase()
  return monthOrderMap.get(text) || index + 1
}

const mergeSeriesRecord = (
  source: Record<string, SebaranPanggilanItem>,
  payload: unknown,
  valueKey: 'permintaan' | 'mobilisasi',
) => {
  if (Array.isArray(payload)) {
    payload.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') return

      const item = entry as SebaranPanggilanItem
      const key = String(
        item.nama_bulan || item.label || item.bulan || item.month || `Data ${index + 1}`,
      ).trim()

      if (!key) return

      source[key] = {
        ...(source[key] || { label: key }),
        ...item,
        label: key,
        [valueKey]:
          valueKey === 'permintaan'
            ? item.permintaan ?? item.jumlah_permintaan ?? item.jml_permintaan ?? item.total_permintaan
            : item.mobilisasi ?? item.jumlah_mobilisasi ?? item.jml_mobilisasi ?? item.total_mobilisasi ?? item.terlayani,
      }
    })
    return
  }

  if (payload && typeof payload === 'object') {
    Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        const item = value as SebaranPanggilanItem
        source[key] = {
          ...(source[key] || { label: key }),
          ...item,
          label: item.label || item.nama_bulan || key,
          [valueKey]:
            valueKey === 'permintaan'
              ? item.permintaan ?? item.jumlah_permintaan ?? item.jml_permintaan ?? item.total_permintaan
              : item.mobilisasi ?? item.jumlah_mobilisasi ?? item.jml_mobilisasi ?? item.total_mobilisasi ?? item.terlayani,
        }
        return
      }

      source[key] = {
        ...(source[key] || { label: key }),
        label: key,
        [valueKey]: value as number | string,
      }
    })
  }
}

const extractSebaranPanggilanItems = (payload?: unknown): SebaranPanggilanItem[] => {
  if (!payload) return []

  if (Array.isArray(payload)) {
    return payload as SebaranPanggilanItem[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if ('data' in record && record.data) {
      const nestedItems = extractSebaranPanggilanItems(record.data)
      if (nestedItems.length > 0) return nestedItems
    }

    const mergedByLabel: Record<string, SebaranPanggilanItem> = {}
    const permintaanSource =
      record.permintaan ?? record.jumlah_permintaan ?? record.total_permintaan ?? null
    const mobilisasiSource =
      record.mobilisasi ?? record.jumlah_mobilisasi ?? record.total_mobilisasi ?? record.terlayani ?? null

    if (permintaanSource || mobilisasiSource) {
      mergeSeriesRecord(mergedByLabel, permintaanSource, 'permintaan')
      mergeSeriesRecord(mergedByLabel, mobilisasiSource, 'mobilisasi')

      const mergedItems = Object.values(mergedByLabel)
      if (mergedItems.length > 0) return mergedItems
    }

    return Object.entries(record)
      .filter(([key]) => key !== 'sukses' && key !== 'pesan' && key !== 'message' && key !== 'status')
      .map(([key, value]) => {
        if (value && typeof value === 'object') {
          return { label: key, ...(value as Record<string, unknown>) } as SebaranPanggilanItem
        }

        return { label: key, permintaan: value as number | string } as SebaranPanggilanItem
      })
  }

  return []
}

const buildSebaranPanggilanSeries = (payload?: unknown) => {
  const items = extractSebaranPanggilanItems(payload)

  return items
    .map((item, index) => {
      const sortKey = getMonthSortKey(item, index)
      const rawLabel =
        String(item.nama_bulan || item.label || item.bulan || item.month || `Data ${index + 1}`).trim()

      return {
        label: normalizeMonthLabel(rawLabel) || `Data ${index + 1}`,
        permintaan: toSafeNumber(
          item.permintaan ?? item.jumlah_permintaan ?? item.jml_permintaan ?? item.total_permintaan,
        ),
        mobilisasi: toSafeNumber(
          item.mobilisasi ?? item.jumlah_mobilisasi ?? item.jml_mobilisasi ?? item.total_mobilisasi ?? item.terlayani,
        ),
        sortKey,
      }
    })
    .filter((item) => item.permintaan > 0 || item.mobilisasi > 0)
    .sort((a, b) => a.sortKey - b.sortKey)
}

const mapRegionRows = (items: RegionItem[] | undefined, key: 'nama_kabupaten' | 'nama_psc') =>
  (items || [])
    .map((item, index) => ({
      name: String(item[key] || `Data ${index + 1}`).trim(),
      gadar: toSafeNumber(item.jumlah_ambulan_gadar),
      transport: toSafeNumber(item.jumlah_ambulan_transport),
    }))
    .filter((item) => item.name)
    .slice(0, 5)

function SummaryCard({
  title,
  value,
  delta,
  baseline,
  tone,
  iconSrc,
  iconAlt,
}: SummaryCardData) {
  const palette = toneClasses[tone]

  return (
    <article
      className={`flex-1 rounded-[24px] border px-5 py-5 shadow-[0_10px_32px_rgba(4,125,120,0.08)] ${palette.card}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className={`max-w-[12rem] text-[1.05rem] font-bold leading-snug ${palette.title}`}>{title}</h3>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${palette.iconWrap}`}>
          <Image src={iconSrc} alt={iconAlt} width={22} height={22} className="h-[22px] w-[22px] object-contain" />
        </div>
      </div>

      <div className={`text-6xl font-extrabold tracking-tight xl:text-7xl ${palette.value}`}>{value}</div>

      <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
        <span className="font-semibold text-slate-700">{delta}</span>
        <span>Kemarin: {baseline}</span>
      </div>
    </article>
  )
}

function SummaryCardSkeleton({ tone }: { tone: ToneKey }) {
  const palette = toneClasses[tone]

  return (
    <article
      className={`flex-1 animate-pulse rounded-[24px] border px-5 py-5 shadow-[0_10px_32px_rgba(4,125,120,0.08)] ${palette.card}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-5 w-36 rounded-full bg-white/70" />
          <div className="h-5 w-28 rounded-full bg-white/60" />
        </div>
        <div className={`h-11 w-11 shrink-0 rounded-full ${palette.iconWrap} opacity-50`} />
      </div>

      <div className="h-16 w-36 rounded-2xl bg-white/80 xl:h-20 xl:w-40" />

      <div className="mt-4 flex items-center gap-3">
        <div className="h-4 w-24 rounded-full bg-white/70" />
        <div className="h-4 w-28 rounded-full bg-white/60" />
      </div>
    </article>
  )
}

function ProvinceMapCardSkeleton({ provinceLabel }: { provinceLabel: string }) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[28px] border border-cyan-200 bg-white shadow-[0_18px_40px_rgba(4,125,120,0.10)]">
      <div className="shrink-0 border-b border-cyan-100 bg-[#dff3f5] px-6 py-4">
        <h2 className="text-[1.15rem] font-bold text-cyan-700">
          Sebaran Spasial Ambulan PSC 119 {provinceLabel}
        </h2>
      </div>

      <div
        className="relative flex-1 overflow-hidden bg-[#abd7e8]"
        style={{ minHeight: '720px' }}
      >
        <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.55),transparent_22%),radial-gradient(circle_at_75%_28%,rgba(255,255,255,0.45),transparent_18%),radial-gradient(circle_at_55%_68%,rgba(255,255,255,0.42),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.28),rgba(171,215,232,0.16))]" />
        <div className="absolute left-6 top-6 h-20 w-20 rounded-full border-4 border-white/80 bg-[#f6bc2f]/85 shadow-[0_10px_20px_rgba(15,23,42,0.12)]" />
        <div className="absolute left-[22%] top-[46%] h-16 w-16 rounded-full border-4 border-white/80 bg-[#f6bc2f]/85 shadow-[0_10px_20px_rgba(15,23,42,0.12)]" />
        <div className="absolute left-[42%] top-[58%] h-24 w-24 rounded-full border-4 border-white/80 bg-[#f6bc2f]/85 shadow-[0_10px_20px_rgba(15,23,42,0.12)]" />
        <div className="absolute right-[18%] top-[34%] h-14 w-14 rounded-full border-4 border-white/80 bg-[#f6bc2f]/85 shadow-[0_10px_20px_rgba(15,23,42,0.12)]" />
        <div className="absolute bottom-6 left-6 rounded-2xl bg-white/92 px-4 py-3 text-sm font-semibold text-slate-500 shadow-md">
          Memuat peta dan marker ambulans...
        </div>
      </div>
    </section>
  )
}

function ChartCardSkeleton({
  title,
  borderClass,
  titleClass,
  heightClass,
}: {
  title: string
  borderClass: string
  titleClass: string
  heightClass: string
}) {
  return (
    <article className={`rounded-[26px] border ${borderClass} bg-white p-5 shadow-[0_18px_40px_rgba(4,125,120,0.08)]`}>
      <h2 className={`max-w-[36rem] text-[1.25rem] font-extrabold leading-tight md:text-[1.65rem] ${titleClass}`}>
        {title}
      </h2>

      <div className={`mt-5 ${heightClass} animate-pulse`}>
        <div className="flex h-full items-end gap-4 rounded-[22px] bg-slate-50 px-5 py-6">
          <div className="h-[38%] flex-1 rounded-t-2xl bg-slate-200" />
          <div className="h-[62%] flex-1 rounded-t-2xl bg-slate-200" />
          <div className="h-[48%] flex-1 rounded-t-2xl bg-slate-200" />
          <div className="h-[82%] flex-1 rounded-t-2xl bg-slate-200" />
          <div className="h-[58%] flex-1 rounded-t-2xl bg-slate-200" />
          <div className="h-[72%] flex-1 rounded-t-2xl bg-slate-200" />
        </div>
      </div>
    </article>
  )
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ color?: string; name?: string; value?: number }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="mb-2 text-sm font-bold text-slate-800">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={`${entry.name}-${entry.value}`} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color || '#94a3b8' }} />
              {entry.name}
            </span>
            <span className="font-bold text-slate-800">{entry.value ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProvinceMapCard({
  provinceCode,
  provinceLabel,
}: {
  provinceCode: string
  provinceLabel: string
}) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[28px] border border-cyan-200 bg-white shadow-[0_18px_40px_rgba(4,125,120,0.10)]">
      <div className="shrink-0 border-b border-cyan-100 bg-[#dff3f5] px-6 py-4">
        <h2 className="text-[1.15rem] font-bold text-cyan-700">
          Sebaran Spasial Ambulan PSC 119 {provinceLabel}
        </h2>
      </div>

      <div className="pscbaru-map-shell relative flex-1 overflow-hidden bg-[#abd7e8]" style={{ minHeight: '720px' }}>
        <IndonesiaMapPlaceholder
          kodeProvinsi={provinceCode}
          showTickets={false}
          showLegend={false}
          showBottomPanel={false}
        />
      </div>
    </section>
  )
}

export default function PscBaruPage() {
  const [provinceDropdownOpen, setProvinceDropdownOpen] = useState(false)
  const [provinceSearch, setProvinceSearch] = useState('')
  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([
    { value: '', label: 'Semua Provinsi' },
  ])
  const [selectedProvince, setSelectedProvince] = useState('')
  const [appliedProvince, setAppliedProvince] = useState('')
  const [summaryCards, setSummaryCards] = useState<SummaryCardData[]>(
    summaryCardTemplates.map((template) => ({
      ...template,
      title: `${template.title} Semua Provinsi`,
      value: '-',
      delta: 'Memuat data',
      baseline: '-',
    })),
  )
  const [wilayahRows, setWilayahRows] = useState<WilayahChartRow[]>([])
  const [panggilanSeries, setPanggilanSeries] = useState<PanggilanChartRow[]>([])
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true)
  const [dashboardError, setDashboardError] = useState('')

  const appliedProvinceLabel = useMemo(() => {
    const match = provinceOptions.find((item) => item.value === appliedProvince)
    return match?.label || 'Semua Provinsi'
  }, [appliedProvince, provinceOptions])

  const selectedProvinceLabel = useMemo(() => {
    const match = provinceOptions.find((item) => item.value === selectedProvince)
    return match?.label || 'Semua Provinsi'
  }, [selectedProvince, provinceOptions])

  const displayProvinceLabel = useMemo(
    () =>
      appliedProvince
        ? `Provinsi ${formatShortProvinceName(appliedProvinceLabel)}`
        : 'Semua Provinsi',
    [appliedProvince, appliedProvinceLabel],
  )

  const filteredProvinceOptions = useMemo(() => {
    const keyword = provinceSearch.trim().toLowerCase()
    if (!keyword) return provinceOptions

    return provinceOptions.filter((option) =>
      option.label.toLowerCase().includes(keyword),
    )
  }, [provinceOptions, provinceSearch])

  useEffect(() => {
    let active = true

    const loadProvinceOptions = async () => {
      try {
        const response = await fetch('/api/psc119/dashboard/provinsi', {
          method: 'POST',
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Gagal memuat provinsi')
        }

        const payload = (await response.json()) as ProvinceResponse
        if (!active) return

        const nextOptions = [
          { value: '', label: 'Semua Provinsi' },
          ...(payload.data || [])
            .map((item) => ({
              value: getProvinceItemValue(item),
              label: toTitleCaseLabel(getProvinceItemLabel(item)),
            }))
            .filter((item) => item.value && item.label)
            .sort((a, b) => a.label.localeCompare(b.label, 'id')),
        ]

        setProvinceOptions(nextOptions)
      } catch {
        if (!active) return
      }
    }

    loadProvinceOptions()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      try {
        setIsLoadingDashboard(true)
        setDashboardError('')

        const requestBody = { kode_provinsi: appliedProvince || '' }
        const [summaryRes, regionRes, callsRes, mapRes, sebaranPanggilanRes] = await Promise.all([
          fetch('/api/psc119/dashboard/rekap-dashboard-psc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            cache: 'no-store',
          }),
          fetch('/api/psc119/dashboard/sebaran-ambulan-wilayah', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            cache: 'no-store',
          }),
          fetch('/api/psc119/dashboard/panggilan-terkini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            cache: 'no-store',
          }),
          fetch('/api/psc119/dashboard/sebaran-peta-ambulan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            cache: 'no-store',
          }),
          fetch('/api/psc119/dashboard/sebaran-panggilan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kode_provinsi: appliedProvince || '',
              tahun: '2026',
            }),
            cache: 'no-store',
          }),
        ])

        if (!summaryRes.ok || !regionRes.ok || !callsRes.ok || !mapRes.ok || !sebaranPanggilanRes.ok) {
          throw new Error('Gagal memuat dashboard provinsi')
        }

        const summaryData = (await summaryRes.json()) as SummaryResponse
        const regionData = (await regionRes.json()) as RegionResponse
        const callsData = (await callsRes.json()) as CallsResponse
        const mapData = (await mapRes.json()) as MapAmbulanceResponse
        const sebaranPanggilanData = (await sebaranPanggilanRes.json()) as SebaranPanggilanResponse

        if (!active) return

        const totalAmbulance =
          toSafeNumber(summaryData.ambulan?.total_gadar) +
          toSafeNumber(summaryData.ambulan?.total_transport)

        const totalPetugas =
          getPetugasTotal(summaryData.petugas) || getUniquePetugasCount(mapData.features_ambulan)
        const petugasBaseline = getPetugasBaseline(summaryData.petugas)
        const petugasDelta = getPetugasTotal(summaryData.petugas)
          ? getPetugasDelta(summaryData.petugas)
          : 'Data Petugas'

        const emergencyCount =
          getEmergencyCount(summaryData.panggilan_emergency) || (callsData.data || []).length
        const emergencyBaseline = getEmergencyBaseline(summaryData.panggilan_emergency)
        const emergencyDelta = getEmergencyCount(summaryData.panggilan_emergency)
          ? getEmergencyDelta(summaryData.panggilan_emergency)
          : 'Data Emergency'

        setSummaryCards([
          {
            ...summaryCardTemplates[0],
            title: `${summaryCardTemplates[0].title} ${displayProvinceLabel}`,
            value: formatNumber(summaryData.psc?.total),
            delta: formatTrendDelta(summaryData.psc?.persentase),
            baseline: formatNumber(summaryData.psc?.total_psc_tahun_lalu ?? summaryData.psc?.tahun_sebelumnya),
          },
          {
            ...summaryCardTemplates[1],
            title: `${summaryCardTemplates[1].title} ${displayProvinceLabel}`,
            value: formatNumber(totalAmbulance),
            delta: 'Total Armada',
            baseline: formatNumber(totalAmbulance),
          },
          {
            ...summaryCardTemplates[2],
            title: `${summaryCardTemplates[2].title} ${displayProvinceLabel}`,
            value: formatNumber(totalPetugas),
            delta: petugasDelta,
            baseline: formatNumber(petugasBaseline || totalPetugas),
          },
          {
            ...summaryCardTemplates[3],
            title: `${summaryCardTemplates[3].title} ${displayProvinceLabel}`,
            value: formatNumber(emergencyCount),
            delta: emergencyDelta,
            baseline: formatNumber(emergencyBaseline || emergencyCount),
          },
          {
            ...summaryCardTemplates[4],
            title: `${summaryCardTemplates[4].title} ${displayProvinceLabel}`,
            value: formatNumber(summaryData.ambulan_on_duty?.hari_ini),
            delta: formatTrendDelta(summaryData.ambulan_on_duty?.persentase),
            baseline: formatNumber(summaryData.ambulan_on_duty?.kemarin),
          },
          {
            ...summaryCardTemplates[5],
            title: `${summaryCardTemplates[5].title} ${displayProvinceLabel}`,
            value: formatNumber(summaryData.ambulan_standby?.hari_ini),
            delta: formatTrendDelta(summaryData.ambulan_standby?.persentase),
            baseline: formatNumber(summaryData.ambulan_standby?.kemarin),
          },
        ])

        const nextWilayahRows = mapRegionRows(regionData.data?.kabupaten, 'nama_kabupaten')
        setWilayahRows(nextWilayahRows)

        const nextPanggilanSeries =
          buildSebaranPanggilanSeries(sebaranPanggilanData).length > 0
            ? buildSebaranPanggilanSeries(sebaranPanggilanData)
            : buildCallSeries(callsData.data || [])
        setPanggilanSeries(nextPanggilanSeries)
      } catch (error) {
        if (!active) return
        setDashboardError((error as Error).message || 'Gagal memuat dashboard provinsi')
        setWilayahRows([])
        setPanggilanSeries([])
        setSummaryCards(
          summaryCardTemplates.map((template) => ({
            ...template,
            title: `${template.title} ${displayProvinceLabel}`,
            value: '-',
            delta: 'Data tidak tersedia',
            baseline: '-',
          })),
        )
      } finally {
        if (active) {
          setIsLoadingDashboard(false)
        }
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [appliedProvince, displayProvinceLabel])

  const handleApplyProvince = () => {
    setProvinceDropdownOpen(false)
    setAppliedProvince(selectedProvince)
  }

  const handleResetProvince = () => {
    setProvinceDropdownOpen(false)
    setProvinceSearch('')
    setSelectedProvince('')
    setAppliedProvince('')
  }

  return (
    <>
      <style jsx global>{`
        body:has([data-pscbaru-root]) > nav,
        body:has([data-pscbaru-root]) > footer {
          display: none !important;
        }

        body:has([data-pscbaru-root]) main {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(0,176,170,0.12), transparent 28%),
            linear-gradient(180deg, #f6fbfb 0%, #edf6f5 100%);
        }

        body:has([data-pscbaru-root]) .pscbaru-map-shell > div {
          height: 100% !important;
          min-height: 720px !important;
          border: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }

        body:has([data-pscbaru-root]) .pscbaru-map-shell .leaflet-container {
          height: 100% !important;
          min-height: 720px !important;
        }

        body:has([data-pscbaru-root]) .leaflet-control-zoom {
          margin-top: 14px;
          margin-left: 14px;
          border: none;
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.18);
        }

        body:has([data-pscbaru-root]) .leaflet-control-zoom a {
          height: 34px;
          width: 34px;
          border: 1px solid #d9eeed;
          background: rgba(255, 255, 255, 0.96);
          color: #0f8784;
          font-weight: 700;
          line-height: 32px;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        body:has([data-pscbaru-root]) .leaflet-control-zoom a:hover {
          background: #0f8784;
          color: #ffffff;
        }
      `}</style>

      <div data-pscbaru-root className="min-h-screen px-4 py-5 text-slate-800 xl:px-5">
        <div className="overflow-hidden rounded-[30px] border border-cyan-100 bg-white shadow-[0_24px_60px_rgba(4,125,120,0.10)]">
          <header className="flex flex-col gap-4 border-b border-cyan-100 bg-white px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <Link
              href="/"
              className="flex w-fit items-center gap-3 rounded-lg transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Image src="/kemenkes.png" alt="Kemenkes" width={140} height={40} className="h-10 w-auto" priority />
              <Image src="/psc.png" alt="PSC 119" width={54} height={40} className="h-10 w-auto" priority />
            </Link>
            <div className="text-center lg:text-right">
              <p className="text-[1.1rem] font-extrabold tracking-[0.03em] text-primary md:text-[1.6rem]">
                DASHBOARD AMBULAN PSC 119 TAHUN 2026
              </p>
            </div>
          </header>

          <div className="px-4 py-4 md:px-5 md:py-5">
            <section className="relative z-[3000] overflow-visible rounded-[22px] bg-gradient-to-r from-primary to-secondary px-4 py-3 text-white shadow-[0_12px_25px_rgba(4,125,120,0.20)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h1 className="text-xl font-extrabold tracking-[0.01em] md:text-[1.6rem]">
                  AMBULAN PSC 119 {displayProvinceLabel.toUpperCase()}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                  <span className="opacity-90">Pilih Provinsi</span>
                  <div className="relative z-[3100]">
                    <button
                      type="button"
                      onClick={() => {
                        setProvinceDropdownOpen((value) => !value)
                        setProvinceSearch('')
                      }}
                      className="flex min-w-[190px] items-center justify-between rounded-full border border-white/80 bg-white px-4 py-2 text-slate-500 shadow-sm outline-none"
                      aria-haspopup="listbox"
                      aria-expanded={provinceDropdownOpen}
                    >
                      <span>{selectedProvinceLabel}</span>
                      <span className="ml-4 text-primary">v</span>
                    </button>

                    {provinceDropdownOpen ? (
                      <div className="absolute left-0 top-[calc(100%+6px)] z-[3200] max-h-72 min-w-[220px] overflow-auto rounded-md border border-slate-200 bg-white shadow-[0_16px_30px_rgba(15,23,42,0.18)]">
                        <div className="sticky top-0 z-[1] border-b border-slate-200 bg-white p-2">
                          <input
                            type="text"
                            value={provinceSearch}
                            onChange={(event) => setProvinceSearch(event.target.value)}
                            placeholder="Cari provinsi..."
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-primary"
                          />
                        </div>

                        {filteredProvinceOptions.length > 0 ? (
                          filteredProvinceOptions.map((option) => (
                            <button
                              key={`${option.value}-${option.label}`}
                              type="button"
                              onClick={() => {
                                setSelectedProvince(option.value)
                                setProvinceDropdownOpen(false)
                                setProvinceSearch('')
                              }}
                              className={`block w-full px-4 py-2 text-left text-sm font-medium ${
                                selectedProvince === option.value
                                  ? 'bg-slate-50 text-primary'
                                  : 'bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                              role="option"
                              aria-selected={selectedProvince === option.value}
                            >
                              {option.label}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500">
                            Provinsi tidak ditemukan.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyProvince}
                    className="rounded-full border border-[#b9ece8] bg-white px-5 py-2 text-primary shadow-sm"
                  >
                    Tampilkan
                  </button>

                  <button
                    type="button"
                    onClick={handleResetProvince}
                    className="rounded-full bg-white/12 px-5 py-2 text-white/90"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </section>

            {provinceDropdownOpen ? (
              <button
                type="button"
                aria-label="Tutup dropdown provinsi"
                className="fixed inset-0 z-[2900] cursor-default bg-transparent"
                onClick={() => {
                  setProvinceDropdownOpen(false)
                  setProvinceSearch('')
                }}
              />
            ) : null}

            {dashboardError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {dashboardError}
              </div>
            ) : null}

            <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_4.6fr_1.1fr] xl:items-stretch">
              <div className="flex h-full flex-col gap-5">
                {isLoadingDashboard
                  ? summaryCardTemplates.slice(0, 3).map((card) => (
                      <SummaryCardSkeleton key={card.key} tone={card.tone} />
                    ))
                  : summaryCards.slice(0, 3).map(({ key, ...card }) => (
                      <SummaryCard key={key} {...card} />
                    ))}
              </div>

              {isLoadingDashboard ? (
                <ProvinceMapCardSkeleton provinceLabel={displayProvinceLabel} />
              ) : (
                <ProvinceMapCard provinceCode={appliedProvince} provinceLabel={displayProvinceLabel} />
              )}

              <div className="flex h-full flex-col gap-5">
                {isLoadingDashboard
                  ? summaryCardTemplates.slice(3).map((card) => (
                      <SummaryCardSkeleton key={card.key} tone={card.tone} />
                    ))
                  : summaryCards.slice(3).map(({ key, ...card }) => (
                      <SummaryCard key={key} {...card} />
                    ))}
              </div>
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-2">
              {isLoadingDashboard ? (
                <>
                  <ChartCardSkeleton
                    title={`Sebaran Ambulan PSC 119 di ${displayProvinceLabel}`}
                    borderClass="border-cyan-200"
                    titleClass="text-[#10a7b8]"
                    heightClass="h-[260px]"
                  />
                  <ChartCardSkeleton
                    title={`Sebaran Panggilan Ambulan PSC 119 di ${displayProvinceLabel}`}
                    borderClass="border-rose-200"
                    titleClass="text-[#ef3b39]"
                    heightClass="h-[300px]"
                  />
                </>
              ) : (
                <>
                  <article className="rounded-[26px] border border-cyan-200 bg-white p-5 shadow-[0_18px_40px_rgba(4,125,120,0.08)]">
                    <h2 className="max-w-[36rem] text-[1.25rem] font-extrabold leading-tight text-[#10a7b8] md:text-[1.65rem]">
                      Sebaran Ambulan PSC 119 di {displayProvinceLabel}
                    </h2>

                    <div className="mt-5 h-[260px]">
                      {wilayahRows.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={wilayahRows}
                            layout="vertical"
                            margin={{ top: 8, right: 18, left: 0, bottom: 12 }}
                            barCategoryGap={10}
                            barGap={0}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" horizontal vertical={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={90}
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip content={<TrendTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                            <Bar dataKey="gadar" name="Total Ambulan Gadar" stackId="a" fill="#ed2c2e" radius={[0, 0, 0, 0]} barSize={18} />
                            <Bar
                              dataKey="transport"
                              name="Total Ambulan Transport"
                              stackId="a"
                              fill="#f6bc2f"
                              radius={[0, 0, 0, 0]}
                              barSize={18}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
                          Data sebaran ambulan belum tersedia.
                        </div>
                      )}
                    </div>
                  </article>

                  <article className="rounded-[26px] border border-rose-200 bg-white p-5 shadow-[0_18px_40px_rgba(4,125,120,0.08)]">
                    <h2 className="max-w-[36rem] text-[1.25rem] font-extrabold leading-tight text-[#ef3b39] md:text-[1.65rem]">
                      Sebaran Panggilan Ambulan PSC 119 di {displayProvinceLabel}
                    </h2>

                    <div className="mt-5 h-[300px]">
                      {panggilanSeries.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={panggilanSeries}
                            margin={{ top: 8, right: 18, left: 0, bottom: 0 }}
                            barCategoryGap={10}
                            barGap={6}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="label"
                              height={40}
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              yAxisId="left"
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip content={<TrendTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '18px', fontSize: '12px' }} iconType="circle" />
                            <Brush dataKey="label" height={18} stroke="#047D78" fill="#e6f7f6" travellerWidth={10} />
                            <Bar
                              yAxisId="left"
                              dataKey="permintaan"
                              name="Total Permintaan Ambulan"
                              fill="#ed2c2e"
                              radius={[0, 0, 0, 0]}
                              barSize={28}
                            />
                            <Bar
                              yAxisId="right"
                              dataKey="mobilisasi"
                              name="Total Ambulan di Mobilisasi"
                              fill="#0f8784"
                              radius={[0, 0, 0, 0]}
                              barSize={28}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
                          Data panggilan ambulan belum tersedia.
                        </div>
                      )}
                    </div>
                  </article>
                </>
              )}
            </section>
          </div>

          <footer className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-400">
            <span>(c) 2026 Kementerian Kesehatan Republik Indonesia</span>
            <span>SITEMAP</span>
          </footer>
        </div>
      </div>
    </>
  )
}
