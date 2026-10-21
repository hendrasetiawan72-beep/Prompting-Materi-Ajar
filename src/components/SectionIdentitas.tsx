import React from 'react';
import { PromptFormData } from '../types';
import { UserCheck, Target, Flame, Wand2 } from 'lucide-react';

interface SectionIdentitasProps {
  data: PromptFormData;
  onChange: <K extends keyof PromptFormData>(field: K, value: PromptFormData[K]) => void;
  onOpenAutofill: () => void;
}

export const SectionIdentitas: React.FC<SectionIdentitasProps> = ({
  data,
  onChange,
  onOpenAutofill,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. IDENTITAS */}
      <div className="border-2 border-stone-900 bg-white rounded-lg neo-shadow overflow-hidden">
        <div className="border-b-2 border-stone-900 bg-[#FEF08A] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-stone-900 bg-white flex items-center justify-center font-bold text-xs neo-shadow-sm">
              1
            </span>
            <h3 className="font-heading font-bold text-sm tracking-tight text-stone-900 uppercase">
              Bagian 1: Identitas Materi & Pembelajaran
            </h3>
          </div>
          <span className="text-[11px] font-mono text-stone-700 bg-white/70 px-2 py-0.5 rounded border border-stone-900/40">
            Wajib
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Mata Pelajaran <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={data.mataPelajaran}
                onChange={(e) => onChange('mataPelajaran', e.target.value)}
                placeholder="mis. Informatika, Bahasa Indonesia, IPAS, Matematika"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all font-medium"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {['Informatika', 'Bahasa Indonesia', 'IPAS', 'Matematika', 'Sejarah', 'DKV / Multimedia'].map((mapel) => (
                  <button
                    key={mapel}
                    type="button"
                    onClick={() => onChange('mataPelajaran', mapel)}
                    className="text-[10px] font-medium px-1.5 py-0.5 bg-stone-100 hover:bg-[#FEF08A] border border-stone-300 rounded transition-colors"
                  >
                    + {mapel}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase text-stone-800">
                  Topik / Materi Pokok <span className="text-rose-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenAutofill}
                  className="text-[11px] font-bold text-purple-700 hover:underline flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" /> Auto-isi AI
                </button>
              </div>
              <input
                type="text"
                value={data.topikMateri}
                onChange={(e) => onChange('topikMateri', e.target.value)}
                placeholder="mis. Keamanan Siber & Deteksi Phishing"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Jenjang, Kelas, Fase <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={data.jenjangKelasFase}
                onChange={(e) => onChange('jenjangKelasFase', e.target.value)}
                placeholder="mis. SMK Kelas X, Fase E / SMP Kelas VIII, Fase D"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[
                  'SD Kelas V, Fase C',
                  'SMP Kelas VII, Fase D',
                  'SMA Kelas X, Fase E',
                  'SMK Kelas X, Fase E',
                  'SMA/SMK Kelas XI, Fase F',
                ].map((fase) => (
                  <button
                    key={fase}
                    type="button"
                    onClick={() => onChange('jenjangKelasFase', fase)}
                    className="text-[10px] font-medium px-1.5 py-0.5 bg-stone-100 hover:bg-[#FEF08A] border border-stone-300 rounded transition-colors"
                  >
                    {fase}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Sekolah / Jurusan / Kelompok <span className="text-stone-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={data.sekolahJurusanKelompok}
                onChange={(e) => onChange('sekolahJurusanKelompok', e.target.value)}
                placeholder="mis. SMKN 1 (Teknik Komputer), SMAN 3, atau kosongkan"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 border-t border-stone-100">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Alokasi Waktu / Durasi
              </label>
              <input
                type="text"
                value={data.durasi}
                onChange={(e) => onChange('durasi', e.target.value)}
                placeholder="mis. 2 pertemuan × 45 menit (90 menit)"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Bahasa Slide
              </label>
              <select
                value={data.bahasaSlide}
                onChange={(e) => onChange('bahasaSlide', e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all font-medium"
              >
                <option value="Indonesia">Indonesia</option>
                <option value="Inggris">Inggris</option>
                <option value="Campuran (Bilingual Indonesia - Inggris)">Campuran (Bilingual)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Bahasa Instruksi Siswa
              </label>
              <input
                type="text"
                value={data.bahasaInstruksiSiswa}
                onChange={(e) => onChange('bahasaInstruksiSiswa', e.target.value)}
                placeholder="mis. Indonesia santai, komunikatif, dan terarah"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. TUJUAN */}
      <div className="border-2 border-stone-900 bg-white rounded-lg neo-shadow overflow-hidden">
        <div className="border-b-2 border-stone-900 bg-[#DCFCE7] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-stone-900 bg-white flex items-center justify-center font-bold text-xs neo-shadow-sm">
              2
            </span>
            <h3 className="font-heading font-bold text-sm tracking-tight text-stone-900 uppercase">
              Bagian 2: Tujuan, Capaian Pembelajaran & Pendekatan
            </h3>
          </div>
          <Target className="w-4 h-4 text-emerald-900" />
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-stone-800">
                CP / TP / ATP (Capaian & Tujuan Pembelajaran)
              </label>
              <button
                type="button"
                onClick={() =>
                  onChange('cpTpAtp', 'buatkan yang selaras Kurikulum Merdeka')
                }
                className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded transition-colors"
              >
                + "Buatkan selaras Kurikulum Merdeka"
              </button>
            </div>
            <textarea
              rows={3}
              value={data.cpTpAtp}
              onChange={(e) => onChange('cpTpAtp', e.target.value)}
              placeholder="Tempel rumusan CP/TP/ATP disini, atau tulis 'buatkan yang selaras Kurikulum Merdeka'"
              className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-stone-800">
                Indikator Berhasil (IKTP)
              </label>
              <button
                type="button"
                onClick={() => onChange('indikatorBerhasil', 'buatkan')}
                className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded transition-colors"
              >
                + Tulis "buatkan"
              </button>
            </div>
            <textarea
              rows={2}
              value={data.indikatorBerhasil}
              onChange={(e) => onChange('indikatorBerhasil', e.target.value)}
              placeholder="mis. 1) Siswa mampu membedakan jenis..., 2) Menganalisis..., 3) Merancang..."
              className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Pengetahuan Awal Siswa (Prasyarat)
              </label>
              <input
                type="text"
                value={data.pengetahuanAwalSiswa}
                onChange={(e) => onChange('pengetahuanAwalSiswa', e.target.value)}
                placeholder="mis. Sudah mengenal internet & smartphone, pernah melihat link promo"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Pendekatan / Model Pembelajaran
              </label>
              <input
                type="text"
                value={data.pendekatan}
                onChange={(e) => onChange('pendekatan', e.target.value)}
                placeholder="mis. Deep learning (mindful, meaningful, joyful), PBL, PjBL, inkuiri"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all font-medium"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[
                  'Deep Learning (Mindful, Meaningful, Joyful)',
                  'Problem-Based Learning (PBL)',
                  'Project-Based Learning (PjBL)',
                  'Inkuiri Terbimbing',
                  'Teaching at The Right Level (TaRL)',
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onChange('pendekatan', item)}
                    className="text-[10px] font-medium px-1.5 py-0.5 bg-stone-100 hover:bg-[#DCFCE7] border border-stone-300 rounded transition-colors"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
