'use client'

import { useEffect, useRef, useState } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import GeoJSON from 'ol/format/GeoJSON'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Fill, Stroke, Style } from 'ol/style'
import { fromLonLat } from 'ol/proj'
import { defaults as defaultControls } from 'ol/control'
import type { FeatureLike } from 'ol/Feature'
import type Feature from 'ol/Feature'
import 'ol/ol.css'

type DensityLevel = 'Rendah' | 'Sedang' | 'Tinggi' | 'Sangat Tinggi'

// Sequential: terang (sedikit faskes) → gelap (banyak faskes)
const densityColors: Record<DensityLevel, string> = {
  Rendah: '#ffffb2',
  Sedang: '#fecc5c',
  Tinggi: '#fd8d3c',
  'Sangat Tinggi': '#bd0026',
}

const densityOrder: DensityLevel[] = ['Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi']

function normalizeProvinceName(value: string) {
  return value
    .toUpperCase()
    .replace(/\bD\.I\.\s*/g, 'D.I. ')
    .replace(/\bDI\.\s*/g, 'DI. ')
    .replace(/\s+/g, ' ')
    .trim()
}

type PetaSebaranItem = {
  kode?: string
  nama?: string
  kode_provinsi?: string
  nama_provinsi?: string
  total_rs?: string | number
  total_puskesmas?: string | number
  total_posyandu?: string | number
  total_klinik?: string | number
  total_pustu?: string | number
  total_bkk?: string | number
  total_faskes?: string | number
  jumlah_penduduk?: string | number
  jml_penduduk?: string | number
  penduduk?: string | number
  populasi?: string | number
  rasio?: string | number
  rasio_kepadatan?: string | number
  rasio_faskes_per_100k?: string | number
  properties?: PetaSebaranItem
  features?: PetaSebaranItem[]
}
type PetaMetrics = {
  densityValue: number
  totalFaskes: number
  population: number
}

function toNumber(value: string | number | undefined) {
  if (typeof value === 'number') return value
  const parsed = Number.parseFloat((value ?? '0').toString().replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function calculateTotalFaskes(item: PetaSebaranItem) {
  return (
    toNumber(item.total_rs) +
    toNumber(item.total_puskesmas) +
    toNumber(item.total_posyandu) +
    toNumber(item.total_klinik) +
    toNumber(item.total_pustu) +
    toNumber(item.total_bkk)
  )
}

function calculateDensityValue(item: PetaSebaranItem) {
  const source = item.properties ?? item
  const directRatio = toNumber(
    source.rasio ?? source.rasio_kepadatan ?? source.rasio_faskes_per_100k,
  )
  if (directRatio > 0) return directRatio

  const population =
    toNumber(
      source.jumlah_penduduk ??
        source.jml_penduduk ??
        source.penduduk ??
        source.populasi,
    )
  if (population <= 0) return 0

  const totalFaskes = calculateTotalFaskes(source)
  return (totalFaskes / population) * 100000
}

function extractPetaRows(payloadData: unknown): PetaSebaranItem[] {
  const visited = new Set<unknown>()

  const walk = (node: unknown): PetaSebaranItem[] => {
    if (!node || visited.has(node)) return []
    visited.add(node)

    if (Array.isArray(node)) {
      return node as PetaSebaranItem[]
    }

    if (typeof node !== 'object') return []
    const obj = node as Record<string, unknown>

    if (Array.isArray(obj.features)) {
      return obj.features as PetaSebaranItem[]
    }

    // Common wrappers from gateways/backend
    const candidateKeys = ['data', 'result', 'payload', 'response']
    for (const key of candidateKeys) {
      if (key in obj) {
        const rows = walk(obj[key])
        if (rows.length > 0) return rows
      }
    }

    return []
  }

  return walk(payloadData)
}

function levelFromDensity(value: number): DensityLevel {
  if (value < 35) return 'Rendah'
  if (value < 55) return 'Sedang'
  if (value < 75) return 'Tinggi'
  return 'Sangat Tinggi'
}

export default function IndonesiaStatusMapClient({
  selectedProvinsi = '',
  selectedKabupaten = '',
}: {
  selectedProvinsi?: string
  selectedKabupaten?: string
}) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const provinceLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const provinceSourceRef = useRef<VectorSource | null>(null)
  const activeFilterRef = useRef<DensityLevel | null>(null)
  const selectedProvinceNameRef = useRef<string>('')
  const densityByProvinceNameRef = useRef<Record<string, number>>({})
  const densityByProvinceCodeRef = useRef<Record<string, number>>({})
  const metricsByProvinceNameRef = useRef<Record<string, PetaMetrics>>({})
  const metricsByProvinceCodeRef = useRef<Record<string, PetaMetrics>>({})
  const [activeFilter, setActiveFilter] = useState<DensityLevel | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<{
    name: string
    densityLevel: DensityLevel
    densityValue: number
    kode: string | number
    totalFaskes: number
    population: number
  } | null>(null)

  useEffect(() => {
    activeFilterRef.current = activeFilter
  }, [activeFilter])

  useEffect(() => {
    selectedProvinceNameRef.current = selectedProvince?.name || ''
  }, [selectedProvince])

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/dashboard-faskes/peta-sebaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode_provinsi: selectedProvinsi,
          kode_kabupaten: selectedKabupaten,
        }),
      })
      if (!response.ok) return
      const payload = (await response.json()) as { data?: unknown }
      const rows = extractPetaRows(payload.data)
      const byName: Record<string, number> = {}
      const byCode: Record<string, number> = {}
      const metricsByName: Record<string, PetaMetrics> = {}
      const metricsByCode: Record<string, PetaMetrics> = {}
      for (const item of rows) {
        const source = item.properties ?? item
        const density = calculateDensityValue(item)
        const totalFaskes = toNumber(source.total_faskes) || calculateTotalFaskes(source)
        const population = toNumber(
          source.jumlah_penduduk ?? source.jml_penduduk ?? source.penduduk ?? source.populasi,
        )
        const name = normalizeProvinceName(
          String(source.nama ?? source.nama_provinsi ?? ''),
        )
        const code = String(source.kode ?? source.kode_provinsi ?? '').trim()
        if (name) {
          byName[name] = density
          metricsByName[name] = { densityValue: density, totalFaskes, population }
        }
        if (code) {
          byCode[code] = density
          metricsByCode[code] = { densityValue: density, totalFaskes, population }
        }
      }
      densityByProvinceNameRef.current = byName
      densityByProvinceCodeRef.current = byCode
      metricsByProvinceNameRef.current = metricsByName
      metricsByProvinceCodeRef.current = metricsByCode
      provinceLayerRef.current?.changed()
    })()
  }, [selectedProvinsi, selectedKabupaten])

  useEffect(() => {
    if (!mapRef.current) return

    const provinceSource = new VectorSource({
      url: '/indonesia-provinces.geojson',
      format: new GeoJSON(),
    })

    const provinceLayer = new VectorLayer({
      source: provinceSource,
      style: (feature: FeatureLike) => {
        const name = String(feature.get('Propinsi') || '')
        const code = String(feature.get('kode') || feature.get('Kode') || '').trim()
        const densityFromName =
          densityByProvinceNameRef.current[normalizeProvinceName(name)]
        const densityFromCode = densityByProvinceCodeRef.current[code]
        const densityValue = densityFromCode ?? densityFromName ?? 0
        const densityLevel = levelFromDensity(densityValue)
        const selectedName = selectedProvinceNameRef.current
        const isSelected =
          selectedName !== '' && selectedName === name
        const disabled =
          activeFilterRef.current !== null && densityLevel !== activeFilterRef.current
        return new Style({
          fill: new Fill({
            color: disabled ? 'rgba(210, 210, 210, 0.4)' : densityColors[densityLevel],
          }),
          stroke: new Stroke({
            color: isSelected ? '#111' : '#ffffff',
            width: isSelected ? 2.5 : 0.8,
          }),
        })
      },
    })

    const map = new Map({
      target: mapRef.current,
      layers: [provinceLayer],
      controls: defaultControls({ attribution: false }),
      view: new View({
        center: fromLonLat([118, -2.5]),
        zoom: 4.6,
        minZoom: 4,
        maxZoom: 8.5,
      }),
    })

    provinceSource.once('change', () => {
      if (provinceSource.getState() !== 'ready') return
      const extent = provinceSource.getExtent()
      if (!extent) return
      map.getView().fit(extent, {
        padding: [20, 20, 20, 20],
        duration: 250,
        maxZoom: 5.8,
      })
    })

    map.on('singleclick', (evt) => {
      const clickedFeature =
        map.forEachFeatureAtPixel(evt.pixel, (f) => f as Feature) ?? null
      if (!clickedFeature) {
        setSelectedProvince(null)
        return
      }
      const propinsiName = String(clickedFeature.get('Propinsi') || '')
      const code = String(clickedFeature.get('kode') || clickedFeature.get('Kode') || '').trim()
      const densityValue =
        densityByProvinceCodeRef.current[code] ??
        densityByProvinceNameRef.current[normalizeProvinceName(propinsiName)] ??
        0
      const metrics =
        metricsByProvinceCodeRef.current[code] ??
        metricsByProvinceNameRef.current[normalizeProvinceName(propinsiName)] ?? {
          densityValue,
          totalFaskes: 0,
          population: 0,
        }
      const densityLevel = levelFromDensity(densityValue)
      const kode = code || '-'
      setSelectedProvince({
        name: propinsiName,
        densityLevel,
        densityValue: metrics.densityValue,
        kode,
        totalFaskes: metrics.totalFaskes,
        population: metrics.population,
      })
      const geometry = clickedFeature.getGeometry()
      if (!geometry) return
      map.getView().fit(geometry.getExtent(), {
        duration: 350,
        padding: [40, 40, 40, 40],
        maxZoom: 7.5,
      })
    })

    mapInstanceRef.current = map
    provinceLayerRef.current = provinceLayer
    provinceSourceRef.current = provinceSource

    return () => {
      map.setTarget(undefined)
      mapInstanceRef.current = null
      provinceLayerRef.current = null
      provinceSourceRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!provinceLayerRef.current || !provinceSourceRef.current) return
    provinceLayerRef.current.changed()
    const source = provinceSourceRef.current
    if (activeFilter === null) return
    const firstMatch = source
      .getFeatures()
      .find(
        (f) => {
          const name = String(f.get('Propinsi') || '')
          const code = String(f.get('kode') || f.get('Kode') || '').trim()
          const densityValue =
            densityByProvinceCodeRef.current[code] ??
            densityByProvinceNameRef.current[normalizeProvinceName(name)] ??
            0
          return levelFromDensity(densityValue) === activeFilter
        },
      )
    if (!firstMatch || !mapInstanceRef.current) return
    const geometry = firstMatch.getGeometry()
    if (!geometry) return
    mapInstanceRef.current.getView().fit(geometry.getExtent(), {
      duration: 300,
      padding: [60, 60, 60, 60],
      maxZoom: 6.6,
    })
  }, [activeFilter])

  useEffect(() => {
    provinceLayerRef.current?.changed()
  }, [selectedProvince])

  // Gradient bar hanya untuk card klik provinsi
  const gradientBar = `linear-gradient(to right, ${densityColors['Rendah']}, ${densityColors['Sedang']}, ${densityColors['Tinggi']}, ${densityColors['Sangat Tinggi']})`

  const markerPercent =
    selectedProvince
      ? selectedProvince.densityLevel === 'Rendah'
        ? 8
        : selectedProvince.densityLevel === 'Sedang'
        ? 35
        : selectedProvince.densityLevel === 'Tinggi'
        ? 65
        : 92
      : 0

  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-2xl border border-[#cde9e8] bg-transparent sm:min-h-[510px]">
      <div ref={mapRef} className="h-full w-full" />

      {/* Legend choropleth */}
      <div className="absolute bottom-1.5 left-1.5 max-w-[68%] rounded-lg border border-[#bfe3e2] bg-[#f3fffe]/95 p-2 shadow-[0_8px_18px_rgba(9,88,89,0.1)] sm:bottom-5 sm:left-5 sm:min-w-[200px] sm:max-w-none sm:rounded-2xl sm:p-4 sm:shadow-[0_10px_30px_rgba(9,88,89,0.15)]">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#2a4040] sm:text-[12px]">
          Legenda
        </p>
        <p className="mb-1.5 hidden text-[10px] leading-relaxed text-[#4c6363] sm:mb-2 sm:block sm:text-[11px]">
          Gradasi kepadatan/jumlah total faskes per wilayah
        </p>
        <ul className="space-y-1 sm:space-y-1.5">
          {densityOrder.map((item) => {
            const isSelected = activeFilter === item
            const rangeLabel =
              item === 'Rendah'
                ? '< 35'
                : item === 'Sedang'
                ? '35 - 54'
                : item === 'Tinggi'
                ? '55 - 74'
                : '>= 75'
            const hintLabel =
              item === 'Rendah'
                ? 'Jumlah faskes sedikit'
                : item === 'Sedang'
                ? 'Jumlah faskes menengah'
                : item === 'Tinggi'
                ? 'Jumlah faskes tinggi'
                : 'Jumlah faskes sangat padat'
            return (
              <li
                key={item}
                className="flex cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 transition-all hover:bg-[#e9f7f7] sm:gap-2"
                style={{ opacity: activeFilter && !isSelected ? 0.45 : 1 }}
                onClick={() => setActiveFilter(isSelected ? null : item)}
              >
                <span
                  className="inline-block h-3 w-3 flex-shrink-0 rounded-[3px] sm:h-3.5 sm:w-3.5"
                  style={{
                    backgroundColor: densityColors[item],
                    outline: isSelected ? `2px solid ${densityColors[item]}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
                <span className="text-[11px] font-medium leading-tight sm:text-[13px]" style={{ color: isSelected ? densityColors[item] : '#3a5050' }}>
                  {item} ({rangeLabel})
                </span>
                <span className="hidden text-[10px] font-normal text-[#6c8585] sm:block">
                  {hintLabel}
                </span>
              </li>
            )
          })}
        </ul>
        {activeFilter && (
          <button
            className="mt-2 w-full rounded-md border border-[#c8e6e5] bg-white py-1 text-[11px] font-semibold text-[#0f8f96] transition-colors hover:bg-[#eef9f9] sm:mt-3 sm:py-1.5 sm:text-[12px]"
            onClick={() => setActiveFilter(null)}
          >
            RESET
          </button>
        )}
      </div>

      {/* Card provinsi — gradient bar muncul HANYA di sini saat diklik */}
      {selectedProvince && (
        <div className="absolute right-5 top-5 min-w-[250px] max-w-[270px] overflow-hidden rounded-2xl border border-[#bfe3e2] bg-[#f3fffe]/95 shadow-[0_10px_30px_rgba(9,88,89,0.15)]">
          {/* Strip warna level di atas card */}
          <div
            className="h-2 w-full"
            style={{ backgroundColor: densityColors[selectedProvince.densityLevel] }}
          />
          <div className="p-4">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#2a4040]">
              Provinsi Dipilih
            </p>
            <p className="mt-1 text-[20px] font-bold leading-tight text-[#223333]">
              {selectedProvince.name}
            </p>

            <p className="mt-2 text-[13px] text-[#4a6060]">
              Kategori:{' '}
              <span
                className="font-semibold"
                style={{ color: densityColors[selectedProvince.densityLevel], fontSize: '14px' }}
              >
                {selectedProvince.densityLevel}
              </span>
            </p>
            <p className="mt-1 text-[13px] text-[#4a6060]">
              Rasio faskes:{' '}
              <span className="font-semibold text-[#223333]">
                {selectedProvince.densityValue > 0
                  ? selectedProvince.densityValue.toFixed(2)
                  : 'Data rasio tidak tersedia'}
              </span>
            </p>
            <p className="mt-1 text-[13px] text-[#4a6060]">
              Total faskes:{' '}
              <span className="font-semibold text-[#223333]">
                {selectedProvince.totalFaskes.toLocaleString('id-ID')}
              </span>
            </p>
            <p className="mt-1 text-[13px] text-[#4a6060]">
              Jumlah penduduk:{' '}
              <span className="font-semibold text-[#223333]">
                {selectedProvince.population > 0
                  ? selectedProvince.population.toLocaleString('id-ID')
                  : 'Data tidak tersedia'}
              </span>
            </p>

            {/* Gradient bar posisi kepadatan — hanya di card ini */}
            <div className="mt-3">
              <p className="mb-1 text-[10px] text-[#7a9f9f]">Posisi kepadatan nasional</p>
              <div
                className="relative h-2.5 w-full rounded-full"
                style={{ background: gradientBar }}
              >
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
                  style={{
                    left: `${markerPercent}%`,
                    backgroundColor: densityColors[selectedProvince.densityLevel],
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-[#7a9f9f]">
                <span>Rendah</span>
                <span>Sangat Tinggi</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

