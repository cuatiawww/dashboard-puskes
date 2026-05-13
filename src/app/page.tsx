'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Building2,
  ChevronUp,
  HeartPulse,
  Stethoscope,
  FileText,
  Sparkles,
  Download,
  Loader2,
} from 'lucide-react'
import IndonesiaStatusMapClient from '@/components/landing/IndonesiaStatusMapClient'
import FilterDropdownBar from '@/components/landing/FilterDropdownBar'
import ChartCardsSection from '@/components/landing/ChartCardsSection'
import FacilityProvinceSection, { type FacilityKey } from '@/components/landing/FacilityProvinceSection'
import InsightModal, { type ModalTab, type InsightData } from '@/components/landing/InsightModal'

const assets = {
  logo: '/Logo-Kemenkes.png',
  headerBackground: '/bg header.png',
  insightBackground: '/bg insght.png',
}

const summaryCards = [
  { id: 'total-faskes', facility: 'all', title: 'TOTAL FASILITAS KESEHATAN', value: '10.123', icon: '/faskes.svg' },
  { id: 'total-rs', facility: 'rumahSakit', title: 'TOTAL RUMAH SAKIT', value: '3.123', icon: '/rumah%20sakit.svg' },
  { id: 'total-puskesmas', facility: 'puskesmas', title: 'TOTAL PUSKESMAS', value: '5.123', icon: '/puskesmas.svg' },
  { id: 'total-posyandu', facility: 'posyandu', title: 'TOTAL POSYANDU', value: '2.123', icon: '/posyandu.svg' },
] as const

export default function HomePage() {
  const [activeFacility, setActiveFacility] = useState<FacilityKey>('puskesmas')
  const [aiInsight, setAiInsight] = useState<InsightData | null>(null)
  const [generatingAi, setGeneratingAi] = useState(false)
  const [downloadingInfo, setDownloadingInfo] = useState(false)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<ModalTab>('ringkasan')

  const openModal = (tab: ModalTab) => {
    setModalTab(tab)
    setModalOpen(true)
  }

  const quickLinks = [
    { key: 'rumahSakit' as const, label: 'RUMAH SAKIT', icon: Building2 },
    { key: 'puskesmas' as const, label: 'PUSKESMAS', icon: Stethoscope },
    { key: 'posyandu' as const, label: 'POSYANDU', icon: HeartPulse },
  ]

  const generateAiInsight = async () => {
    if (generatingAi) return
    setGeneratingAi(true)
    try {
      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gaps: [
            { rank: 1, name: 'Ketersediaan Alat Kesehatan', pct: 82 },
            { rank: 2, name: 'Layanan Kesehatan Anak (MTBS)', pct: 67 },
            { rank: 3, name: 'Tenaga Gizi di Wilayah Terpencil', pct: 61 },
            { rank: 4, name: 'Sarana Air Bersih Faskes', pct: 54 },
            { rank: 5, name: 'Sistem Rujukan Berjenjang', pct: 48 },
          ],
          stats: [
            { num: '72%', label: 'Tingkat Kepatuhan Nasional' },
            { num: '10.123', label: 'Total Faskes Terdaftar' },
            { num: '34', label: 'Provinsi Terevaluasi' },
          ],
          criticalProvinces: ['Papua Pegunungan', 'Papua Selatan', 'Maluku Utara'],
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Gagal generate AI')
      }

      const data = (await res.json()) as InsightData
      setAiInsight(data)
      openModal('ringkasan')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal generate AI insight')
    } finally {
      setGeneratingAi(false)
    }
  }

  const ensureHtml2Canvas = async () => {
    if (typeof window === 'undefined') return null
    type Html2CanvasFn = (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>
    const win = window as Window & { html2canvas?: Html2CanvasFn }
    if (win.html2canvas) return win.html2canvas
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Gagal memuat library export'))
      document.head.appendChild(script)
    })
    return win.html2canvas ?? null
  }

  const downloadAiInfografis = async () => {
    if (!aiInsight || downloadingInfo) return
    setDownloadingInfo(true)
    try {
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-99999px'
      container.style.top = '0'
      container.style.width = '1080px'
      container.style.background = 'linear-gradient(180deg,#ecfbfb 0%,#dff5f4 100%)'
      container.style.padding = '44px'
      container.style.fontFamily = 'Inter, Arial, sans-serif'
      container.style.color = '#163e3e'
      container.innerHTML = `
        <div style="background:#ffffff;border:2px solid #bfe4e2;border-radius:24px;padding:28px;box-shadow:0 14px 36px rgba(15,143,150,.14);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;">
            <div>
              <div style="font-size:31px;font-weight:800;line-height:1.2;">AI Insight - Kinerja Fasilitas Kesehatan</div>
              <div style="font-size:15px;color:#4d7676;margin-top:5px;">Data per 11 Mei 2026 - Kemenkes RI</div>
            </div>
            <div style="font-size:12px;color:#0f8f96;background:#e6f7f6;padding:6px 10px;border-radius:999px;font-weight:700;">Generated</div>
          </div>
          <div style="border-left:4px solid #16b7b2;background:#f1fcfb;border-radius:12px;padding:14px 16px;margin-bottom:18px;font-size:17px;line-height:1.6;">
            ${aiInsight.summary}
          </div>
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6a8f8f;font-weight:700;margin-bottom:8px;">Rekomendasi Tindakan</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            ${aiInsight.recommendations
              .slice(0, 4)
              .map(
                (r, i) => `
              <div style="background:#fff;border:1px solid #cfe9e8;border-left:4px solid #16b7b2;border-radius:12px;padding:10px 12px;font-size:14px;line-height:1.5;">
                <div style="font-size:11px;color:#0f8f96;font-weight:700;margin-bottom:3px;">REKOM ${i + 1}</div>
                ${r}
              </div>`
              )
              .join('')}
          </div>
        </div>
      `
      document.body.appendChild(container)

      const html2canvas = await ensureHtml2Canvas()
      if (!html2canvas) throw new Error('Library export tidak tersedia')
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ecfbfb' })
      container.remove()

      const link = document.createElement('a')
      link.download = `ai-insight-kemenkes-${new Date().toISOString().slice(0, 10)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal download infografis')
    } finally {
      setDownloadingInfo(false)
    }
  }

  const insightPreviewText =
    aiInsight?.summary ??
    'GAP terbesar nasional berada pada alat kesehatan, layanan anak, dan ketersediaan tenaga gizi di wilayah terpencil.'

  return (
    <div className="min-h-screen bg-[#fbffff] text-slate-800">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <section className="w-full">
        <div className="relative overflow-hidden border-y border-[#cfeeed] bg-[#eefdfd]">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${assets.headerBackground}')` }}
          />
          <div className="absolute inset-0 bg-[rgba(245,255,255,0.34)]" />

          <div className="relative flex min-h-[219px] w-full flex-row gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-6 lg:items-center lg:justify-between lg:px-6 lg:py-7">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-5">
              <div className="flex h-[70px] w-[190px] flex-shrink-0 items-center justify-start sm:h-[108px] sm:w-[302px]">
                <Image
                  src={assets.logo}
                  alt="Logo Kemenkes"
                  width={302}
                  height={108}
                  className="h-[70px] w-auto sm:h-[108px]"
                  priority
                />
              </div>

              <div className="max-w-[529px]">
                <h1 className="text-[12px] font-bold uppercase leading-[1.45] text-[#008c95] sm:text-[24px] lg:text-[30px] lg:leading-[48px]">
                  <span className="block">Dashboard Indikator Penilaian</span>
                  <span className="block">Kinerja Fasilitas Kesehatan</span>
                </h1>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center lg:justify-end">
              {quickLinks.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveFacility(item.key)}
                  className={`inline-flex items-center justify-center gap-2 rounded-[16px] px-3 py-2 text-[10px] font-bold tracking-[0.09em] uppercase transition-all sm:justify-start sm:gap-3 sm:rounded-[18px] sm:px-5 sm:py-2.5 sm:text-[11px] sm:tracking-[0.12em] ${
                    item.key === activeFacility
                      ? 'border border-[#10b9b4] bg-[#1dc7bf] text-white shadow-[0_12px_26px_rgba(29,199,191,0.28)]'
                      : 'border border-[#d5eceb] bg-white/90 text-[#3f5a5a] hover:-translate-y-0.5 hover:border-[#9fdedb] hover:bg-[#f7fcfc] hover:text-[#0f8f96]'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      item.key === activeFacility ? 'bg-white/20' : 'bg-[#eef7f7]'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Summary Cards ────────────────────────────────────────────────────── */}
      <section className="w-full bg-[#fbffff] py-3">
        <div className="w-full px-4 sm:px-5 lg:px-6">
          <FilterDropdownBar />

          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <article
                key={card.id}
                className="flex min-h-[118px] w-full items-center gap-3 border border-[#bedbda] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(20,120,116,0.06)] transition-all sm:px-5 sm:py-3.5"
                style={{
                  borderTopLeftRadius: '17px',
                  borderTopRightRadius: '17px',
                  borderBottomRightRadius: '22px',
                  borderBottomLeftRadius: '17px',
                }}
              >
                <div className="flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center rounded-full bg-[#e8efef]">
                  <Image src={card.icon} alt={card.title} width={44} height={44} className="h-11 w-11" />
                </div>
                <div>
                  <p className="text-[12px] font-bold leading-none text-[#4f4f4f] sm:text-[13px]">
                    {card.title}
                  </p>
                  <p className="mt-2 text-[42px] font-bold leading-[0.92] tracking-[-0.02em] text-[#454545] sm:text-[52px]">
                    {card.value}
                  </p>
                  <p className="mt-2.5 text-[12px] text-[#383838] sm:text-[13px]">
                    <span className="inline-flex items-center gap-1 font-bold text-[#17b7b2]">
                      <ChevronUp className="h-3.5 w-3.5 stroke-[2.8]" />
                      2,1%
                    </span>{' '}
                    dari bulan sebelumnya
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Insight + Map Section ────────────────────────────────────────────── */}
      <section className="w-full bg-[#fbffff] pb-5">
        <div className="grid w-full grid-cols-1 gap-4 px-4 sm:px-5 lg:px-6 xl:grid-cols-[381px_minmax(0,1fr)] xl:items-start">

          <div className="space-y-3">

            {/* ── Insight Card (IMPROVED) ─────────────────────────────────── */}
            <article
              className="relative overflow-hidden border border-[#b7d9d8] p-5 xl:h-[415px] xl:w-[381px]"
              style={{
                backgroundImage: `url('${assets.insightBackground}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center bottom',
                backgroundRepeat: 'no-repeat',
                borderTopLeftRadius: '17px',
                borderTopRightRadius: '17px',
                borderBottomRightRadius: '22px',
                borderBottomLeftRadius: '17px',
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(237,251,250,0.72)_0%,rgba(231,247,246,0.60)_100%)]" />

              <div className="relative z-10 flex h-full flex-col">
                {/* Icon + Title */}
                <div className="flex items-start gap-3">
                  <Image
                    src="/insight.svg"
                    alt="Insight"
                    width={52}
                    height={52}
                    className="h-13 w-13 flex-shrink-0"
                  />
                  <h3 className="text-[15px] font-bold leading-[1.3] text-[#1a3535] sm:text-[17px]">
                    Analisis Penilaian Indikator Kinerja Fasilitas Kesehatan
                  </h3>
                </div>

                {/* Body text */}
                <div className="mt-3 rounded-xl border-l-[3px] border-l-[#16b7b2] bg-white/60 px-3 py-2.5 backdrop-blur-[2px]">
                  <p className="text-[13px] leading-relaxed text-[#2f4040] sm:text-[14px]">
                    {insightPreviewText}
                  </p>
                </div>

                {/* Divider */}
                <div className="my-4 h-px bg-[rgba(0,0,0,0.08)]" />

                {/* ── Action Buttons (IMPROVED) ────────────────────────── */}
                <div className="mt-auto grid grid-cols-3 gap-2">

                  {/* Detail */}
                  <button
                    onClick={() => openModal('ringkasan')}
                    disabled={!aiInsight}
                    className="group flex flex-col items-center gap-2 rounded-[14px] bg-[#0f8f96] px-2 py-3 text-white shadow-[0_4px_14px_rgba(15,143,150,0.32)] transition-all hover:-translate-y-0.5 hover:bg-[#0c7a80] hover:shadow-[0_6px_20px_rgba(15,143,150,0.42)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-[#0f8f96] disabled:hover:shadow-[0_4px_14px_rgba(15,143,150,0.32)]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:scale-110">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.08em]">
                      {aiInsight ? 'Detail' : 'Generate Dulu'}
                    </span>
                  </button>

                  {/* Generate AI */}
                  <button
                    onClick={generateAiInsight}
                    className="group flex flex-col items-center gap-2 rounded-[14px] bg-gradient-to-br from-[#4d90d0] to-[#6c5ce7] px-2 py-3 text-white shadow-[0_4px_14px_rgba(77,144,208,0.32)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(108,92,231,0.42)] active:scale-95"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:scale-110">
                      {generatingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-center leading-tight">
                      {generatingAi ? 'Loading...' : 'Generate AI'}
                    </span>
                  </button>

                  {/* Download */}
                  <button
                    onClick={downloadAiInfografis}
                    className="group flex flex-col items-center gap-2 rounded-[14px] bg-[#16b7b2] px-2 py-3 text-white shadow-[0_4px_14px_rgba(22,183,178,0.32)] transition-all hover:-translate-y-0.5 hover:bg-[#10a09c] hover:shadow-[0_6px_20px_rgba(22,183,178,0.42)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!aiInsight || downloadingInfo}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:scale-110">
                      {downloadingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.08em]">
                      {downloadingInfo ? 'Proses...' : 'Download'}
                    </span>
                  </button>
                </div>
              </div>
            </article>

            {/* Source card */}
            <article
              className="border border-[#b7c8c9] bg-[#e9f1f2] p-4 xl:h-[183px] xl:w-[381px]"
              style={{
                borderTopLeftRadius: '17px',
                borderTopRightRadius: '17px',
                borderBottomRightRadius: '22px',
                borderBottomLeftRadius: '17px',
              }}
            >
              <h4 className="text-[18px] font-bold text-[#2f3a3a] sm:text-[22px]">Sumber Data:</h4>
              <p className="mt-1 text-[14px] text-[#3f4a4a] sm:text-[16px]">
                Kementerian Kesehatan Republik Indonesia
              </p>
              <h4 className="mt-4 text-[18px] font-bold text-[#2f3a3a] sm:text-[22px]">Data per:</h4>
              <p className="mt-1 text-[14px] text-[#3f4a4a] sm:text-[16px]">11 Mei 2026 10.00 WIB</p>
            </article>
          </div>

          {/* Map Card */}
          <article
            className="border border-[#cdcdcd] bg-white p-4 xl:h-[615px]"
            style={{
              borderTopLeftRadius: '17px',
              borderTopRightRadius: '17px',
              borderBottomRightRadius: '22px',
              borderBottomLeftRadius: '17px',
            }}
          >
            <h3 className="text-[22px] font-bold leading-tight text-[#2f2f2f] sm:text-[30px]">
              SEBARAN SPASIAL STATUS FASILITAS KESEHATAN NASIONAL
            </h3>
            <p className="mt-1 text-[14px] leading-relaxed text-[#4b4b4b] sm:text-[16px]">
              Pemetaan ini menyajikan gambaran komprehensif mengenai distribusi geografis dan
              klasifikasi status Fasilitas Kesehatan di seluruh wilayah Indonesia.
            </p>
            <div className="mt-4 h-[300px] sm:h-[350px] md:h-[420px] xl:h-[470px]">
              <IndonesiaStatusMapClient />
            </div>
          </article>
        </div>
      </section>

      {/* ── Chart Cards ──────────────────────────────────────────────────────── */}
      <ChartCardsSection />
      <FacilityProvinceSection key={activeFacility} activeFacility={activeFacility} />

      {/* ── Insight Modal ────────────────────────────────────────────────────── */}
      <InsightModal
        key={modalTab}
        open={modalOpen}
        defaultTab={modalTab}
        aiInsight={aiInsight}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
