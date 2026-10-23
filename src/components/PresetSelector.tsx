import React from 'react';
import { PRESET_TEMPLATES } from '../data/presets';
import { PromptFormData } from '../types';
import { Bookmark, Flame } from 'lucide-react';

interface PresetSelectorProps {
  currentData: PromptFormData;
  onSelectPreset: (presetData: Partial<PromptFormData>) => void;
  onOpenAutofill: () => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  onSelectPreset,
  onOpenAutofill,
}) => {
  return (
    <div className="border-2 border-stone-900 bg-white p-4 rounded-lg neo-shadow mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b-2 border-stone-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 border border-stone-900 bg-[#FED7AA] rounded">
            <Bookmark className="w-4 h-4 text-stone-900" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-sm text-stone-900">
              Template Contoh Kurikulum (1-Klik Isi)
            </h2>
            <p className="text-xs text-stone-600">
              Pilih template acuan berikut atau gunakan tombol AI untuk mengisi otomatis topik spesifik Anda:
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAutofill}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 border-stone-900 bg-[#E9D5FF] hover:bg-[#d8b4fe] rounded text-stone-900 neo-shadow-sm neo-shadow-hover transition-colors shrink-0"
        >
          <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
          <span> Auto-Isi Topik Baru dengan AI</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {PRESET_TEMPLATES.map((preset, idx) => {
          const bgColors = ['bg-[#DCFCE7]', 'bg-[#FEF08A]', 'bg-[#FCE7F3]', 'bg-[#E0F2FE]'];
          const bg = bgColors[idx % bgColors.length];

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.data)}
              className={`text-left p-3 border-2 border-stone-900 ${bg} hover:brightness-95 rounded-md neo-shadow-sm neo-shadow-hover transition-all flex flex-col justify-between`}
            >
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-stone-700 font-bold mb-1">
                  {preset.tag}
                </div>
                <div className="font-heading font-bold text-xs text-stone-900 line-clamp-1 mb-1">
                  {preset.nama}
                </div>
                <div className="text-[11px] text-stone-700 line-clamp-2 leading-relaxed">
                  {preset.deskripsi}
                </div>
              </div>
              <div className="mt-2 text-[10px] font-bold text-stone-900 underline flex items-center gap-1">
                <span>Terapkan template ini →</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
