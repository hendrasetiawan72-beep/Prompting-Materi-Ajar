import React, { useState } from 'react';
import { PromptFormData } from '../types';
import { Palette, FileQuestion, Image, Eye, Code, School, Flame, Sparkles } from 'lucide-react';

interface SectionVisualCatatanProps {
  data: PromptFormData;
  onChange: <K extends keyof PromptFormData>(field: K, value: PromptFormData[K]) => void;
}

export const SectionVisualCatatan: React.FC<SectionVisualCatatanProps> = ({
  data,
  onChange,
}) => {
  const [showLogoPreview, setShowLogoPreview] = useState(true);
  const [showBgPreview, setShowBgPreview] = useState(true);

  return (
    <div className="space-y-6">
      {/* 8. GAYA VISUAL */}
      <div className="border-2 border-stone-900 bg-white rounded-lg neo-shadow overflow-hidden">
        <div className="border-b-2 border-stone-900 bg-[#DCFCE7] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-stone-900 bg-white flex items-center justify-center font-bold text-xs neo-shadow-sm">
              8
            </span>
            <h3 className="font-heading font-bold text-sm tracking-tight text-stone-900 uppercase">
              Bagian 8: Gaya Visual & Desain Slide
            </h3>
          </div>
          <Palette className="w-4 h-4 text-emerald-900" />
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
              Tema Visual
            </label>
            <input
              type="text"
              value={data.temaVisual}
              onChange={(e) => onChange('temaVisual', e.target.value)}
              placeholder="mis. Vintage Postmodernism Neobrutalist Colorful Pastel Elegant"
              className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white font-medium"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {[
                'Vintage Postmodernism Neobrutalist Colorful Pastel Elegant',
                'Modern Responsif & Dinamis, minimalis elegan',
                'Warm Botanical Earth-tone pastel',
                'Clean Scientific & Monospace Minimalis',
                'Playful Ceria Anak Edukatif',
              ].map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => onChange('temaVisual', theme)}
                  className="text-[10px] font-medium px-2 py-0.5 bg-stone-100 hover:bg-[#DCFCE7] border border-stone-300 rounded transition-colors"
                >
                  + {theme}
                </button>
              ))}
            </div>
          </div>

          {/* PILIHAN EFEK & ANIMASI TRANSISI SLIDE */}
          <div className="p-3.5 border-2 border-stone-900 bg-[#FAF7F2] rounded-lg space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-800" />
                <label className="text-xs font-bold uppercase text-stone-900">
                  Pilihan Efek & Animasi Slide
                </label>
              </div>
              <span className="text-[11px] font-mono text-emerald-900 bg-[#DCFCE7] px-2 py-0.5 rounded border border-emerald-800 font-bold">
                Transisi CSS Modern
              </span>
            </div>

            <input
              type="text"
              value={data.efekSlide || ''}
              onChange={(e) => onChange('efekSlide', e.target.value)}
              placeholder="Pilih atau ketik efek transisi slide yang diinginkan..."
              className="w-full px-3 py-2 text-xs font-medium border-2 border-stone-900 rounded bg-white focus:outline-none"
            />

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {[
                {
                  id: 'Fade Halus & Transisi Modern (Smooth Opacity & Translation)',
                  name: 'Fade Halus Modern',
                  desc: 'Transisi opacity dan translate halus berkelas',
                  badge: 'Rekomendasi',
                },
                {
                  id: 'Slide Horizontal (Geser Kiri/Kanan Halus + Touch Swipe)',
                  name: 'Slide Horizontal',
                  desc: 'Geser kiri/kanan seperti presentasi mobile & swipe',
                  badge: 'Populer',
                },
                {
                  id: 'Card Flip 3D (Efek Balik Kartu Presisi)',
                  name: 'Card Flip 3D',
                  desc: 'Rotasi 3D sumbu Y seolah membalik flashcard',
                  badge: 'Interaktif',
                },
                {
                  id: 'Zoom & Pop Edukatif (Skala & Efek Timbul Dinamis)',
                  name: 'Zoom & Pop',
                  desc: 'Scale-in elastis lembut untuk menarik atensi siswa',
                  badge: 'Ceria',
                },
                {
                  id: 'Parallax Glow Neobrutalist (Bayangan & Aksen Bergerak)',
                  name: 'Parallax Glow',
                  desc: 'Aksen bayangan tegas pastel neobrutalisme',
                  badge: 'Estetik',
                },
                {
                  id: 'Minimalis Cepat (Tanpa Delay, Ramah Kuota & Perangkat Rendah)',
                  name: 'Minimalis Cepat',
                  desc: 'Tanpa animasi berat, instan & hemat daya laptop/HP',
                  badge: 'Ringan',
                },
              ].map((efek) => {
                const isSelected = data.efekSlide === efek.id;
                return (
                  <button
                    key={efek.id}
                    type="button"
                    onClick={() => onChange('efekSlide', efek.id)}
                    className={`p-2.5 text-left border-2 border-stone-900 rounded transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#FEF08A] text-stone-900 neo-shadow-sm font-medium'
                        : 'bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-stone-900">{efek.name}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            isSelected
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-stone-100 text-stone-600 border-stone-300'
                          }`}
                        >
                          {efek.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-600 leading-snug">{efek.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase text-stone-800">
                  Palet Warna & Tipografi Font
                </label>
                <button
                  type="button"
                  onClick={() => onChange('paletFont', 'pilihkan')}
                  className="text-[10px] text-emerald-800 font-bold underline"
                >
                  Set "pilihkan"
                </button>
              </div>
              <input
                type="text"
                value={data.paletFont}
                onChange={(e) => onChange('paletFont', e.target.value)}
                placeholder="mis. Pastel hangat (cream, mint, peach) & sans clean atau 'pilihkan'"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Deskripsi Logo / Gambar Panduan
              </label>
              <input
                type="text"
                value={data.logoGambar}
                onChange={(e) => onChange('logoGambar', e.target.value)}
                placeholder="mis. Logo sekolah di kiri atas dan ilustrasi vintage di slide pembuka"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white"
              />
            </div>
          </div>

          {/* KOLOM HTML: LAMPIRAN GAMBAR LOGO SEKOLAH */}
          <div className="p-3.5 border-2 border-stone-900 bg-[#FAF7F2] rounded-lg space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <School className="w-4 h-4 text-emerald-800" />
                <label className="text-xs font-bold uppercase text-stone-900">
                  Kolom HTML Lampiran Logo Sekolah
                </label>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      'htmlLogoSekolah',
                      '<img src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120&auto=format&fit=crop&q=80" alt="Logo Sekolah" class="h-10 w-auto rounded border border-stone-800" />'
                    )
                  }
                  className="text-[10px] font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-900 px-2 py-0.5 rounded"
                >
                  + Contoh Tag &lt;img&gt;
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      'htmlLogoSekolah',
                      '<div class="flex items-center gap-2"><svg class="w-8 h-8 text-stone-800" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM3.45 9L12 4.33 20.55 9 12 13.67 3.45 9zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg><span class="font-bold text-sm">SMK NEGERI</span></div>'
                    )
                  }
                  className="text-[10px] font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-900 px-2 py-0.5 rounded"
                >
                  + Logo SVG Toga
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoPreview(!showLogoPreview)}
                  className="text-[10px] font-bold text-stone-600 underline ml-1"
                >
                  {showLogoPreview ? 'Sembunyikan Pratinjau' : 'Lihat Pratinjau'}
                </button>
              </div>
            </div>

            <textarea
              rows={2}
              value={data.htmlLogoSekolah}
              onChange={(e) => onChange('htmlLogoSekolah', e.target.value)}
              placeholder='Tempel kode HTML gambar logo sekolah disini, contoh: <img src="https://..." alt="Logo Sekolah" class="h-10" />'
              className="w-full px-3 py-2 text-xs font-mono border-2 border-stone-900 rounded bg-white focus:outline-none"
            />

            {/* Live Preview of School Logo */}
            {showLogoPreview && data.htmlLogoSekolah && (
              <div className="p-2 border border-stone-900/40 bg-white rounded flex items-center justify-between">
                <span className="text-[10px] font-mono text-stone-500">Pratinjau HTML Logo:</span>
                <div
                  className="inline-flex items-center"
                  dangerouslySetInnerHTML={{ __html: data.htmlLogoSekolah }}
                />
              </div>
            )}
          </div>

          {/* KOLOM HTML: LAMPIRAN GAMBAR BACKGROUND SEKOLAH */}
          <div className="p-3.5 border-2 border-stone-900 bg-[#FAF7F2] rounded-lg space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Image className="w-4 h-4 text-emerald-800" />
                <label className="text-xs font-bold uppercase text-stone-900">
                  Kolom HTML Lampiran Background / Banner Sekolah
                </label>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      'htmlBackgroundSekolah',
                      '<div class="absolute inset-0 opacity-15 bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>'
                    )
                  }
                  className="text-[10px] font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-900 px-2 py-0.5 rounded"
                >
                  + Pola Vintage Grid
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      'htmlBackgroundSekolah',
                      '<div class="w-full h-32 bg-cover bg-center rounded border border-stone-900" style="background-image: url(\'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80\');"></div>'
                    )
                  }
                  className="text-[10px] font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-900 px-2 py-0.5 rounded"
                >
                  + Banner Gedung Sekolah
                </button>
                <button
                  type="button"
                  onClick={() => setShowBgPreview(!showBgPreview)}
                  className="text-[10px] font-bold text-stone-600 underline ml-1"
                >
                  {showBgPreview ? 'Sembunyikan Pratinjau' : 'Lihat Pratinjau'}
                </button>
              </div>
            </div>

            <textarea
              rows={2}
              value={data.htmlBackgroundSekolah}
              onChange={(e) => onChange('htmlBackgroundSekolah', e.target.value)}
              placeholder='Tempel kode HTML/CSS background sekolah disini, contoh: <div class="bg-cover..." style="background-image:url(...)"></div>'
              className="w-full px-3 py-2 text-xs font-mono border-2 border-stone-900 rounded bg-white focus:outline-none"
            />

            {/* Live Preview of School Background */}
            {showBgPreview && data.htmlBackgroundSekolah && (
              <div className="p-2 border border-stone-900/40 bg-white rounded space-y-1">
                <span className="text-[10px] font-mono text-stone-500 block">Pratinjau HTML Background:</span>
                <div
                  className="relative overflow-hidden min-h-[60px] rounded border border-dashed border-stone-400 p-2 flex items-center justify-center text-xs text-stone-700 font-medium"
                  dangerouslySetInnerHTML={{ __html: data.htmlBackgroundSekolah }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-stone-800 mb-1.5">
              Sertakan Emoji & Ikon Visual?
            </label>
            <div className="flex items-center gap-3">
              {[
                { val: 'ya' as const, label: 'Ya, sertakan emoji / ikon relevan' },
                { val: 'tidak' as const, label: 'Tidak, gunakan desain teks murni' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => onChange('emojiIkon', opt.val)}
                  className={`px-3 py-1.5 text-xs font-bold border-2 border-stone-900 rounded transition-all ${
                    data.emojiIkon === opt.val
                      ? 'bg-[#FEF08A] text-stone-900 neo-shadow-sm'
                      : 'bg-[#FAF7F2] text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 9. CATATAN KHUSUS */}
      <div className="border-2 border-stone-900 bg-white rounded-lg neo-shadow overflow-hidden">
        <div className="border-b-2 border-stone-900 bg-[#FED7AA] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-stone-900 bg-white flex items-center justify-center font-bold text-xs neo-shadow-sm">
              9
            </span>
            <h3 className="font-heading font-bold text-sm tracking-tight text-stone-900 uppercase">
              Bagian 9: Catatan Khusus & Batasan Guru
            </h3>
          </div>
          <FileQuestion className="w-4 h-4 text-amber-900" />
        </div>

        <div className="p-4 sm:p-5">
          <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
            Instruksi Khusus (Wajib Ada / Harus Dihindari / Acuan Gaya)
          </label>
          <textarea
            rows={3}
            value={data.catatanKhusus}
            onChange={(e) => onChange('catatanKhusus', e.target.value)}
            placeholder="mis. Wajib sertakan studi kasus kontekstual SMK, hindari istilah teknis tanpa penjelasan, buat kalimat instruksi singkat dan memotivasi."
            className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
          />
          <p className="text-[11px] text-stone-500 mt-1.5">
            🔥 Tips: Anda dapat menuliskan batasan spesifik, istilah kunci yang harus dipertahankan, atau panduan diferensiasi untuk siswa berkebutuhan khusus.
          </p>
        </div>
      </div>
    </div>
  );
};
