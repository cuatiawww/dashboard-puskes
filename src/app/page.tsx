'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Building2, ChevronUp, HeartPulse, Stethoscope, FileText, Sparkles, Download } from 'lucide-react'
import IndonesiaStatusMapClient from '@/components/landing/IndonesiaStatusMapClient'
import FilterDropdownBar from '@/components/landing/FilterDropdownBar'
import ChartCardsSection from '@/components/landing/ChartCardsSection'
import FacilityProvinceSection, { type FacilityKey } from '@/components/landing/FacilityProvinceSection'

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
  const quickLinks = [
    { key: 'rumahSakit' as const, label: 'RUMAH SAKIT', icon: Building2 },
    { key: 'puskesmas' as const, label: 'PUSKESMAS', icon: Stethoscope },
    { key: 'posyandu' as const, label: 'POSYANDU', icon: HeartPulse },
  ]
  return (
    <div className="min-h-screen bg-[#fbffff] text-slate-800">
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

      <section className="w-full bg-[#fbffff] py-3">
        <div className="w-full px-4 sm:px-5 lg:px-6">
          <FilterDropdownBar />

          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              return (
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
                  <p className="text-[12px] font-bold leading-none text-[#4f4f4f] sm:text-[13px]">{card.title}</p>
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
              )
            })}
          </div>
        </div>
      </section>

      <section className="w-full bg-[#fbffff] pb-5">
        <div className="grid w-full grid-cols-1 gap-4 px-4 sm:px-5 lg:px-6 xl:grid-cols-[381px_minmax(0,1fr)] xl:items-start">
          <div className="space-y-3">
            <article
              className="relative overflow-hidden border border-[#b7d9d8] p-4 xl:h-[415px] xl:w-[381px]"
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
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(237,251,250,0.68)_0%,rgba(231,247,246,0.56)_100%)]" />
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start gap-3">
                  <Image src="/insight.svg" alt="Insight" width={56} height={56} className="h-14 w-14 flex-shrink-0" />
                  <h3 className="text-[16px] font-bold leading-[1.25] text-[#2f3a3a] sm:text-[18px]">
                    Analisis Penilaian Indikator Kinerja Fasilitas Kesehatan
                  </h3>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-[#2f3f3f] sm:mt-3 sm:text-[15px]">
                  GAP terbesar nasional berada pada alat kesehatan, layanan anak, dan ketersediaan tenaga gizi di
                  wilayah terpencil.
                </p>

                <div className="mt-auto flex gap-1.5 overflow-hidden pt-4 sm:gap-2 sm:pt-5">
                  <button className="inline-flex flex-1 items-center justify-center gap-1 rounded-[10px] bg-[#0f8f96] px-1.5 py-1.5 text-[8px] font-bold uppercase tracking-wider text-white transition-all hover:bg-[#0d7a81] active:scale-95 sm:flex-none sm:gap-1.5 sm:px-3 sm:py-2 sm:text-[11px]">
                    <FileText className="h-3 w-3 flex-shrink-0 sm:h-3.5 sm:w-3.5" />
                    <span className="truncate">DETAIL</span>
                  </button>
                  <button className="inline-flex flex-1 items-center justify-center gap-1 rounded-[10px] bg-[#4d90d0] px-1.5 py-1.5 text-[8px] font-bold uppercase tracking-wider text-white transition-all hover:bg-[#3d7ab5] active:scale-95 sm:flex-none sm:gap-1.5 sm:px-3 sm:py-2 sm:text-[11px]">
                    <Sparkles className="h-3 w-3 flex-shrink-0 sm:h-3.5 sm:w-3.5" />
                    <span className="truncate">REKOMENDASI</span>
                  </button>
                  <button className="inline-flex flex-1 items-center justify-center gap-1 rounded-[10px] bg-[#16b7b2] px-1.5 py-1.5 text-[8px] font-bold uppercase tracking-wider text-white transition-all hover:bg-[#109d97] active:scale-95 sm:flex-none sm:gap-1.5 sm:px-3 sm:py-2 sm:text-[11px]">
                    <Download className="h-3 w-3 flex-shrink-0 sm:h-3.5 sm:w-3.5" />
                    <span className="truncate">DOWNLOAD</span>
                  </button>
                </div>
              </div>
            </article>

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
              <p className="mt-1 text-[14px] text-[#3f4a4a] sm:text-[16px]">Kementerian Kesehatan Republik Indonesia</p>
              <h4 className="mt-4 text-[18px] font-bold text-[#2f3a3a] sm:text-[22px]">Data per:</h4>
              <p className="mt-1 text-[14px] text-[#3f4a4a] sm:text-[16px]">11 Mei 2026 10.00 WIB</p>
            </article>
          </div>

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
              Pemetaan ini menyajikan gambaran komprehensif mengenai distribusi geografis dan klasifikasi status
              Fasilitas Kesehatan di seluruh wilayah Indonesia.
            </p>
            <div className="mt-4 h-[300px] sm:h-[350px] md:h-[420px] xl:h-[470px]">
              <IndonesiaStatusMapClient />
            </div>
          </article>
        </div>
      </section>

      {/* ── Chart Cards Section ─────────────────────────────────────────────── */}
      <ChartCardsSection />
      <FacilityProvinceSection key={activeFacility} activeFacility={activeFacility} />

    </div>
  )
}
