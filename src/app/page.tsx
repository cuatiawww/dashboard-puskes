import Image from 'next/image'
import Link from 'next/link'

const assets = {
  logo: '/Logo-Kemenkes.png',
  headerBackground: '/BG.png',
}

export default function HomePage() {
  const quickLinks = [
    { label: 'Rumah Sakit', href: '#' },
    { label: 'Puskesmas', href: '#', active: true },
    { label: 'Posyandu', href: '#' },
  ]

  return (
    <div className="min-h-screen bg-[#f3fbfb] text-slate-800">
      <section className="w-full">
        <div className="relative overflow-hidden border-y border-[#d5efef] bg-[#eef9f8]">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
            style={{ backgroundImage: `url('${assets.headerBackground}')` }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_rgba(238,249,248,0.75)_42%,_rgba(224,244,243,0.95)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(186,226,224,0)_0%,rgba(186,226,224,0.68)_100%)]" />
          <div className="absolute left-10 top-5 h-28 w-28 rounded-full bg-white/35 blur-2xl" />
          <div className="absolute right-20 top-3 h-32 w-32 rounded-full bg-[#bdeeed]/55 blur-2xl" />
          <div className="pointer-events-none absolute inset-0 opacity-50">
            <div className="absolute left-[24%] top-7 h-12 w-20 rounded-xl border border-[#d7eceb]" />
            <div className="absolute left-[41%] top-8 h-16 w-24 rounded-2xl border border-[#d7eceb]" />
            <div className="absolute right-[27%] top-5 h-12 w-16 rounded-full border border-[#d7eceb]" />
            <div className="absolute right-[12%] top-4 h-16 w-20 rotate-[-24deg] rounded-[30px] border border-[#d7eceb]" />
            <div className="absolute bottom-0 left-[8%] h-16 w-28 rounded-t-[60px] border border-b-0 border-[#d7eceb]" />
            <div className="absolute bottom-0 left-[35%] h-14 w-36 rounded-t-[70px] border border-b-0 border-[#d7eceb]" />
            <div className="absolute bottom-0 right-[10%] h-16 w-28 rounded-t-[60px] border border-b-0 border-[#d7eceb]" />
          </div>

          <div className="mx-auto flex min-h-[219px] w-full max-w-[1440px] flex-col gap-8 px-4 py-7 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-9">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center sm:h-20 sm:w-20">
                <Image
                  src={assets.logo}
                  alt="Logo Kemenkes"
                  width={64}
                  height={64}
                  className="h-12 w-auto sm:h-14"
                  priority
                />
              </div>

              <div className="max-w-[620px]">
                <h1 className="mt-2 text-lg font-bold uppercase leading-snug text-[#008c95] sm:text-2xl lg:text-[34px]">
                  Dashboard Indikator Penilaian Kinerja Fasilitas Kesehatan
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              {quickLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold transition-all sm:px-6 ${
                    item.active
                      ? 'bg-[#1dc7bf] text-white shadow-[0_12px_30px_rgba(29,199,191,0.35)]'
                      : 'border border-[#e5efef] bg-white/90 text-slate-600 hover:border-[#bfe7e5] hover:text-[#008c95]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
