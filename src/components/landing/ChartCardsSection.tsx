'use client'

import { useEffect, useRef, useState } from 'react'

type ChartInstance = { destroy: () => void; update: (mode?: string) => void }
type FacilityFilter = 'rumah-sakit' | 'puskesmas' | 'pustu' | 'klinik' | 'posyandu' | 'bbkk'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Chart: new (canvas: HTMLCanvasElement, config: any) => ChartInstance
  }
}

const FASKES_DATA = [
  { id: 'rumah-sakit', label: 'Rumah Sakit', shortLabel: 'Rumah Sakit', value: 2956, percentage: '0,89%', color: '#2f80ed' },
  { id: 'puskesmas', label: 'Puskesmas', shortLabel: 'Puskesmas', value: 10321, percentage: '3,12%', color: '#4ac97a' },
  { id: 'pustu', label: 'Pustu', shortLabel: 'Pustu', value: 25147, percentage: '7,61%', color: '#ffa62b' },
  { id: 'klinik', label: 'Klinik', shortLabel: 'Klinik', value: 9397, percentage: '2,84%', color: '#9b51e0' },
  { id: 'posyandu', label: 'Posyandu', shortLabel: 'Posyandu', value: 282704, percentage: '85,55%', color: '#f45ca1' },
  { id: 'bbkk', label: 'BBKK/BKK/LKK', shortLabel: 'BBKK/\nBKK/LKK', value: 132, percentage: '0,04%', color: '#39c6cf' },
] as const

let chartJsLoaded = false
const chartJsCallbacks: (() => void)[] = []

function loadChartJs(cb: () => void) {
  if (typeof window === 'undefined') return
  if (chartJsLoaded) {
    cb()
    return
  }
  chartJsCallbacks.push(cb)
  if (chartJsCallbacks.length > 1) return

  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
  script.onload = () => {
    chartJsLoaded = true
    chartJsCallbacks.forEach((fn) => fn())
  }
  document.head.appendChild(script)
}

function useChartJs(onReady: () => void) {
  useEffect(() => {
    loadChartJs(onReady)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

function formatNumber(value: number) {
  return value.toLocaleString('id-ID')
}

function fadeColor(hex: string, opacity: number) {
  const normalized = hex.replace('#', '')
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function getSelectedData(selectedIds: FacilityFilter[]) {
  return FASKES_DATA.filter((item) => selectedIds.includes(item.id))
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <article
      className="relative overflow-hidden bg-white"
      style={{
        border: '1.5px solid #d6ecec',
        borderRadius: '18px',
        boxShadow: '0 10px 28px rgba(15, 143, 150, 0.06)',
      }}
    >
      <div className="p-5 sm:p-6">
        <div className="mb-5">
          <h3 className="text-[18px] font-bold uppercase leading-tight text-[#1f3131] sm:text-[20px]">
            {title}
          </h3>
          {description ? (
            <p className="mt-2 text-[14px] leading-relaxed text-[#5f7a79]">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </article>
  )
}

function RingkasanFaskesCard({
  selectedIds,
  onSelectionChange,
}: {
  selectedIds: FacilityFilter[]
  onSelectionChange: (selectedIds: FacilityFilter[]) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartInstance | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const filteredData = getSelectedData(selectedIds)
  const totalValue = filteredData.map((item) => item.value).reduce((sum, value) => sum + value, 0)
  const isAllActive = selectedIds.length === FASKES_DATA.length
  const displayActiveIndex = isAllActive ? activeIndex : null

  const toggleSelection = (id: FacilityFilter) => {
    const nextIds = selectedIds.includes(id)
      ? selectedIds.filter((itemId) => itemId !== id)
      : [...selectedIds, id]

    onSelectionChange(nextIds.length === 0 ? FASKES_DATA.map((item) => item.id) : nextIds)
  }

  const syncColors = (index: number | null) => {
    const chart = chartRef.current as unknown as {
      data: { datasets: { backgroundColor: string[] }[] }
      update: (mode?: string) => void
    } | null

    if (!chart) return

    chart.data.datasets[0].backgroundColor = filteredData.map((item, itemIndex) =>
      index === null || itemIndex === index ? item.color : fadeColor(item.color, 0.2)
    )
    chart.update('none')
  }

  const buildChart = () => {
    if (!canvasRef.current || !window.Chart) return
    chartRef.current?.destroy()

    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: filteredData.map((item) => item.label),
        datasets: [
          {
            data: filteredData.map((item) => item.value),
            backgroundColor: filteredData.map((item) => item.color),
            borderColor: '#ffffff',
            borderWidth: 4,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '69%',
        animation: { duration: 900 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#153838',
            titleColor: '#ffffff',
            bodyColor: '#d7f2ef',
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context: { dataIndex: number }) => {
                const item = filteredData[context.dataIndex]
                return `${item.label}: ${formatNumber(item.value)} (${item.percentage})`
              },
            },
          },
        },
        onHover: (_: unknown, elements: { index: number }[]) => {
          const nextIndex = elements.length > 0 ? elements[0].index : null
          if (nextIndex !== activeIndex) {
            setActiveIndex(nextIndex)
          }
        },
        onClick: (_: unknown, elements: { index: number }[]) => {
          if (elements.length === 0) {
            setActiveIndex(null)
            return
          }
          const clicked = elements[0].index
          setActiveIndex((current) => (current === clicked ? null : clicked))
        },
      },
    })
  }

  useChartJs(buildChart)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Chart) {
      buildChart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds])

  useEffect(() => {
    syncColors(displayActiveIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayActiveIndex, selectedIds])

  useEffect(() => () => chartRef.current?.destroy(), [])

  return (
    <SectionCard
      title="Ringkasan Faskes Secara Nasional"
      description="Ringkasan ini menampilkan proporsi fasilitas kesehatan secara nasional per jenis layanan. Gunakan daftar di samping untuk menyorot atau memfilter kategori pada chart."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] lg:items-center">
        <div className="relative mx-auto h-[280px] w-full max-w-[320px]">
          <canvas
            ref={canvasRef}
            aria-label="Ringkasan Faskes Secara Nasional"
            role="img"
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[14px] font-semibold uppercase tracking-[0.2em] text-[#516b6b]">
              {isAllActive ? 'Total' : `${selectedIds.length} Jenis Aktif`}
            </span>
            <span className="mt-2 text-[34px] font-bold leading-none text-[#1d2f2f] sm:text-[42px]">
              {formatNumber(totalValue)}
            </span>
            <span className="mt-2 text-[15px] font-bold uppercase tracking-[0.12em] text-[#2c5756]">
              {isAllActive ? 'Faskes' : 'Faskes'}
            </span>
          </div>
        </div>

        <div className="grid gap-3">
          {FASKES_DATA.map((item, index) => {
            const isSelected = selectedIds.includes(item.id)
            const isMuted = !isSelected
            return (
              <button
                key={item.label}
                type="button"
                onMouseEnter={() => {
                  if (isAllActive) setActiveIndex(index)
                }}
                onMouseLeave={() => {
                  if (isAllActive) setActiveIndex(null)
                }}
                onClick={() => toggleSelection(item.id)}
                className={`flex items-center justify-between rounded-[14px] border px-4 py-3 text-left transition ${
                  isMuted ? 'opacity-45' : 'opacity-100'
                }`}
                style={{
                  borderColor: isSelected ? fadeColor(item.color, 0.42) : '#d9e9e8',
                  background: isSelected ? fadeColor(item.color, 0.08) : '#ffffff',
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-[14px] font-semibold text-[#233737]">{item.label}</p>
                    <p className="text-[12px] text-[#668484]">{item.percentage}</p>
                  </div>
                </div>
                <span className="text-[16px] font-bold text-[#163434]">
                  {formatNumber(item.value)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </SectionCard>
  )
}

function SebaranJenisFaskesCard({
  selectedIds,
}: {
  selectedIds: FacilityFilter[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartInstance | null>(null)
  const filteredData = getSelectedData(selectedIds)
  const isAllActive = selectedIds.length === FASKES_DATA.length

  const buildChart = () => {
    if (!canvasRef.current || !window.Chart) return
    chartRef.current?.destroy()

    const valueLabelsPlugin = {
      id: 'valueLabelsPlugin',
      afterDatasetsDraw(chart: {
        ctx: CanvasRenderingContext2D
        data: { datasets: { data: number[] }[] }
        getDatasetMeta: (datasetIndex: number) => {
          data: Array<{ x: number; y: number; base: number }>
        }
      }) {
        const { ctx } = chart
        const meta = chart.getDatasetMeta(0)
        ctx.save()
        ctx.font = '700 11px Arial'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.18)'
        ctx.shadowBlur = 6

        filteredData.forEach((item, index) => {
          const bar = meta.data[index]
          if (!bar) return

          const labelY = (bar.base + bar.y) / 2
          ctx.fillText(formatNumber(item.value), bar.x, labelY)
        })

        ctx.restore()
      },
    }

    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: filteredData.map((item) =>
          item.id === 'bbkk' ? ['BBKK/', 'BKK/LKK'] : item.shortLabel
        ),
        datasets: [
          {
            data: filteredData.map((item) => item.value),
            backgroundColor: filteredData.map((item) => item.color),
            borderRadius: 10,
            borderSkipped: false,
            barPercentage: 0.72,
            categoryPercentage: filteredData.length === 1 ? 0.46 : 0.76,
            minBarLength: 22,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#153838',
            titleColor: '#ffffff',
            bodyColor: '#d7f2ef',
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context: { dataIndex: number }) => {
                const item = filteredData[context.dataIndex]
                return `${formatNumber(item.value)} faskes (${item.percentage})`
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: '#425d5d',
              font: { size: 12, weight: '600' },
              maxRotation: 0,
              minRotation: 0,
            },
          },
          y: {
            beginAtZero: true,
            suggestedMax: isAllActive
              ? 300000
              : Math.max(filteredData[0].value * 1.2, 1000),
            grid: { color: 'rgba(24, 128, 132, 0.10)' },
            border: { display: false },
            ticks: {
              stepSize: isAllActive
                ? 100000
                : Math.max(1, Math.ceil(filteredData[0].value / 4 / 1000) * 1000),
              color: '#6e8b8a',
              font: { size: 12 },
              callback: (value: string | number) => {
                if (Number(value) === 0) return '0'
                if (!isAllActive && Number(value) < 1000) return formatNumber(Number(value))
                return `${Math.round(Number(value) / 1000)} RB`
              },
            },
          },
        },
      },
      plugins: [valueLabelsPlugin],
    })
  }

  useChartJs(buildChart)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Chart) {
      buildChart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds])
  useEffect(() => () => chartRef.current?.destroy(), [])

  return (
    <SectionCard
      title="Grafik Sebaran Per Jenis Faskes"
      description="Grafik batang ini memperlihatkan perbandingan jumlah faskes pada setiap jenis layanan. Nilai pada sumbu vertikal menampilkan volume fasilitas untuk memudahkan analisis kategori tertinggi dan terendah."
    >
      <div className="rounded-[16px] border border-[#e3f1f0] bg-[linear-gradient(180deg,#fcffff_0%,#f5fbfb_100%)] p-3 sm:p-4">
        <div className="h-[340px] sm:h-[380px]">
          <canvas
            ref={canvasRef}
            aria-label="Grafik Sebaran Per Jenis Faskes"
            role="img"
          />
        </div>
      </div>
    </SectionCard>
  )
}

export default function ChartCardsSection() {
  const [selectedIds, setSelectedIds] = useState<FacilityFilter[]>(
    FASKES_DATA.map((item) => item.id)
  )

  return (
    <section className="w-full border-t border-[#e0eeee] bg-[#f4fafa] py-6">
      <div className="w-full px-4 sm:px-5 lg:px-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <RingkasanFaskesCard selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
          <SebaranJenisFaskesCard selectedIds={selectedIds} />
        </div>
      </div>
    </section>
  )
}
