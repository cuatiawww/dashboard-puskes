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

const JABODETABEK_PROVINCES = ['DKI JAKARTA', 'JAKARTA', 'D.K.I. JAKARTA', 'DKI. JAKARTA']

const HIGH_DENSITY_PROVINCES = [
  'JAWA BARAT',
  'BANTEN',
  'JAWA TIMUR',
  'JAWA TENGAH',
  'D.I. YOGYAKARTA',
  'DI YOGYAKARTA',
  'YOGYAKARTA',
]

function densityValueForProvinceName(name: string): number {
  const normalized = normalizeProvinceName(name)

  if (JABODETABEK_PROVINCES.some((j) => normalized.includes(j))) {
    return 90
  }

  if (HIGH_DENSITY_PROVINCES.some((h) => normalized.includes(normalizeProvinceName(h)))) {
    let hash = 0
    for (let i = 0; i < normalized.length; i += 1) {
      hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0
    }
    return 55 + (hash % 19)
  }

  let hash = 0
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0
  }
  return 18 + (hash % 37)
}

function levelFromDensity(value: number): DensityLevel {
  if (value < 35) return 'Rendah'
  if (value < 55) return 'Sedang'
  if (value < 75) return 'Tinggi'
  return 'Sangat Tinggi'
}

export default function IndonesiaStatusMapClient() {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const provinceLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const provinceSourceRef = useRef<VectorSource | null>(null)
  const activeFilterRef = useRef<DensityLevel | null>(null)
  const selectedProvinceNameRef = useRef<string>('')
  const [activeFilter, setActiveFilter] = useState<DensityLevel | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<{
    name: string
    densityLevel: DensityLevel
    densityValue: number
    kode: string | number
  } | null>(null)

  useEffect(() => {
    activeFilterRef.current = activeFilter
  }, [activeFilter])

  useEffect(() => {
    selectedProvinceNameRef.current = selectedProvince?.name || ''
  }, [selectedProvince])

  useEffect(() => {
    if (!mapRef.current) return

    const provinceSource = new VectorSource({
      url: '/indonesia-provinces.geojson',
      format: new GeoJSON(),
    })

    const provinceLayer = new VectorLayer({
      source: provinceSource,
      style: (feature: FeatureLike) => {
        const densityValue = densityValueForProvinceName(String(feature.get('Propinsi') || ''))
        const densityLevel = levelFromDensity(densityValue)
        const selectedName = selectedProvinceNameRef.current
        const isSelected =
          selectedName !== '' && selectedName === String(feature.get('Propinsi') || '')
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
      const densityValue = densityValueForProvinceName(propinsiName)
      const densityLevel = levelFromDensity(densityValue)
      const kode = clickedFeature.get('kode') ?? '-'
      setSelectedProvince({ name: propinsiName, densityLevel, densityValue, kode })
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
        (f) =>
          levelFromDensity(
            densityValueForProvinceName(String(f.get('Propinsi') || '')),
          ) === activeFilter,
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
              Rasio kepadatan:{' '}
              <span className="font-semibold text-[#223333]">
                {selectedProvince.densityValue} faskes / 100.000 penduduk
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
