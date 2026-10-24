import React from 'react';
import { Search, Image as ImageIcon, Video, Info } from 'lucide-react';
import { AiMediaTarget } from '../types';

interface AiMediaPanelProps {
  /** Judul panel, mis. "Materi" atau "Soal Kuis" */
  title: string;
  /** Contoh kata kunci pada placeholder */
  keywordPlaceholder: string;
  value: AiMediaTarget;
  onChange: (next: AiMediaTarget) => void;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n) || min));

export const AiMediaPanel: React.FC<AiMediaPanelProps> = ({ title, keywordPlaceholder, value, onChange }) => {
  const aktif = value.gambar || value.video;

  const update = (patch: Partial<AiMediaTarget>) => onChange({ ...value, ...patch });

  return (
    <div className="p-3 border-2 border-stone-900 bg-[#ECFDF5] rounded-md space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-stone-900">
          <Search className="w-3.5 h-3.5 text-emerald-800" />
          <span>Minta AI mencarikan media dari internet ({title})</span>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
            aktif
              ? 'bg-emerald-200 text-emerald-950 border-emerald-800'
              : 'bg-stone-100 text-stone-500 border-stone-400'
          }`}
        >
          {aktif ? 'AKTIF' : 'MATI'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Gambar */}
        <div
          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 border-2 border-stone-900 rounded ${
            value.gambar ? 'bg-[#FEF08A]' : 'bg-white'
          }`}
        >
          <label className="flex items-center gap-2 text-xs font-bold text-stone-900 cursor-pointer">
            <input
              type="checkbox"
              checked={value.gambar}
              onChange={(e) => update({ gambar: e.target.checked })}
              className="rounded border-stone-900 text-stone-900 focus:ring-0"
            />
            <ImageIcon className="w-3.5 h-3.5 text-purple-800" />
            <span>Gambar</span>
          </label>
          <label className="flex items-center gap-1 text-[10px] text-stone-700">
            maks
            <input
              type="number"
              min={1}
              max={10}
              value={value.maksGambar}
              disabled={!value.gambar}
              onChange={(e) => update({ maksGambar: clamp(Number(e.target.value), 1, 10) })}
              className="w-12 px-1 py-0.5 text-xs border border-stone-900 rounded bg-white disabled:opacity-40"
            />
          </label>
        </div>

        {/* Video YouTube */}
        <div
          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 border-2 border-stone-900 rounded ${
            value.video ? 'bg-[#FEF08A]' : 'bg-white'
          }`}
        >
          <label className="flex items-center gap-2 text-xs font-bold text-stone-900 cursor-pointer">
            <input
              type="checkbox"
              checked={value.video}
              onChange={(e) => update({ video: e.target.checked })}
              className="rounded border-stone-900 text-stone-900 focus:ring-0"
            />
            <Video className="w-3.5 h-3.5 text-rose-700" />
            <span>Video YouTube (embed)</span>
          </label>
          <label className="flex items-center gap-1 text-[10px] text-stone-700">
            maks
            <input
              type="number"
              min={1}
              max={6}
              value={value.maksVideo}
              disabled={!value.video}
              onChange={(e) => update({ maksVideo: clamp(Number(e.target.value), 1, 6) })}
              className="w-12 px-1 py-0.5 text-xs border border-stone-900 rounded bg-white disabled:opacity-40"
            />
          </label>
        </div>
      </div>

      {aktif && (
        <input
          type="text"
          value={value.kataKunci}
          onChange={(e) => update({ kataKunci: e.target.value })}
          placeholder={keywordPlaceholder}
          className="w-full px-3 py-1.5 text-xs border-2 border-stone-900 rounded bg-white focus:outline-none"
        />
      )}

      <div className="flex items-start gap-1.5 text-[11px] text-stone-700 leading-snug">
        <Info className="w-3.5 h-3.5 text-emerald-800 shrink-0 mt-0.5" />
        <span>
          Prompt akan meminta AI mencari media yang sesuai topik lalu menyematkannya sebagai kode embed HTML. AI harus
          punya akses pencarian web (mis. Gemini, ChatGPT, atau Claude dengan fitur search). Tanpa akses itu, AI diminta
          menulis placeholder dan kata kunci, bukan mengarang tautan. Cek video dan gambar sebelum dipakai di kelas.
        </span>
      </div>
    </div>
  );
};
