import React, { useState } from 'react';
import { PromptFormData } from '../types';
import { AKTIVITAS_KATEGORI } from '../data/presets';
import { AiMediaPanel } from './AiMediaPanel';
import { Check, CheckSquare, Link as LinkIcon, AlertCircle, Image, Video, Eye, Film } from 'lucide-react';

interface SectionAktivitasProps {
  data: PromptFormData;
  onChange: <K extends keyof PromptFormData>(field: K, value: PromptFormData[K]) => void;
}

export const SectionAktivitas: React.FC<SectionAktivitasProps> = ({
  data,
  onChange,
}) => {
  const [showMateriMediaPreview, setShowMateriMediaPreview] = useState(true);

  const selectedCount = data.aktivitasTerpilih.length;
  const isOptimal = selectedCount >= 3 && selectedCount <= 6;
  const isUnder = selectedCount < 3;
  const isOver = selectedCount > 6;

  const toggleAktivitas = (id: string) => {
    const exists = data.aktivitasTerpilih.includes(id);
    const updated = exists
      ? data.aktivitasTerpilih.filter((item) => item !== id)
      : [...data.aktivitasTerpilih, id];
    onChange('aktivitasTerpilih', updated);
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-stone-900 bg-white rounded-lg neo-shadow overflow-hidden">
        <div className="border-b-2 border-stone-900 bg-[#FCE7F3] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-stone-900 bg-white flex items-center justify-center font-bold text-xs neo-shadow-sm">
              5
            </span>
            <h3 className="font-heading font-bold text-sm tracking-tight text-stone-900 uppercase">
              Bagian 5: Menu Aktivitas Pembelajaran (Centang 3–6)
            </h3>
          </div>

          {/* Counter Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded border-2 border-stone-900 text-xs font-bold neo-shadow-sm ${
              isOptimal
                ? 'bg-[#86efac] text-stone-900'
                : isUnder
                ? 'bg-[#FEF08A] text-stone-900'
                : 'bg-[#FED7AA] text-stone-900'
            }`}
          >
            {isOptimal ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            <span>
              {selectedCount} Terpilih {isOptimal ? '(Ideal: 3–6)' : isUnder ? '(Rekomendasi minimal 3)' : '(Maksimal 6 disarankan)'}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          <p className="text-xs text-stone-600">
            Pilihlah kombinasi aktivitas yang seimbang antara pemantik rasa ingin tahu, kolaborasi mendalam, praktik bertahap, dan refleksi bermakna:
          </p>

          <div className="space-y-4">
            {AKTIVITAS_KATEGORI.map((kat) => (
              <div
                key={kat.kategori}
                className={`p-3.5 border-2 border-stone-900 rounded-lg ${kat.color} neo-shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-xs uppercase tracking-wide text-stone-900">
                    {kat.kategori}
                  </span>
                  <span className="text-[10px] text-stone-600 font-mono">
                    {kat.items.filter((i) => data.aktivitasTerpilih.includes(i.id)).length} dari {kat.items.length} dipilih
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {kat.items.map((item) => {
                    const isChecked = data.aktivitasTerpilih.includes(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleAktivitas(item.id)}
                        className={`text-left p-2.5 rounded border-2 border-stone-900 flex items-start gap-2 transition-all ${
                          isChecked
                            ? 'bg-white font-bold text-stone-900 neo-shadow-sm'
                            : 'bg-white/50 text-stone-700 hover:bg-white/80'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 border-stone-900 flex items-center justify-center shrink-0 mt-0.5 ${
                            isChecked ? 'bg-[#FEF08A]' : 'bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3] text-stone-900" />}
                        </div>
                        <span className="text-xs leading-snug">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Special external game URL field if 'game eksternal' is checked */}
                {kat.kategori === 'Opsional' && data.aktivitasTerpilih.includes('game eksternal') && (
                  <div className="mt-3 pt-2.5 border-t border-stone-900/20 flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1 shrink-0">
                      <LinkIcon className="w-3.5 h-3.5" /> URL Game Eksternal:
                    </span>
                    <input
                      type="url"
                      value={data.gameExternalUrl}
                      onChange={(e) => onChange('gameExternalUrl', e.target.value)}
                      placeholder="https://wordwall.net/play/... atau https://quizizz.com/..."
                      className="flex-1 px-3 py-1.5 text-xs border-2 border-stone-900 rounded bg-white focus:outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KOLOM HTML: LAMPIRAN GAMBAR / VIDEO UNTUK MATERI PEMBELAJARAN */}
      <div className="border-2 border-stone-900 bg-white rounded-lg neo-shadow overflow-hidden">
        <div className="border-b-2 border-stone-900 bg-[#E0F2FE] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-sky-900" />
            <h3 className="font-heading font-bold text-sm tracking-tight text-stone-900 uppercase">
              Kolom HTML Media Materi (Gambar, Infografis & Embed Video)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-sky-900 bg-white/70 px-2 py-0.5 rounded border border-stone-900/40">
            Materi
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          <p className="text-xs text-stone-600">
            Sediakan kode HTML untuk gambar ilustrasi konsep, diagram alur, atau video penjelasan materi (YouTube / MP4) yang akan disematkan di slide materi:
          </p>

          <AiMediaPanel
            title="Materi"
            keywordPlaceholder="Kata kunci / preferensi (opsional), mis. contoh pesan phishing WhatsApp, kanal edukasi, durasi di bawah 5 menit"
            value={data.aiMedia.materi}
            onChange={(next) => onChange('aiMedia', { ...data.aiMedia, materi: next })}
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase text-stone-800">
              Kode HTML Media Materi (opsional):
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onChange(
                    'htmlMediaMateri',
                    '<div class="p-3 bg-white border-2 border-stone-800 rounded-md shadow-[2px_2px_0px_#1c1917]"><img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80" alt="Ilustrasi Materi" class="w-full h-48 object-cover rounded mb-2" /><p class="text-xs text-stone-600 italic">Gambar 1. Ilustrasi dan diagram konsep materi pokok.</p></div>'
                  )
                }
                className="text-[10px] font-bold text-stone-700 bg-[#FAF7F2] hover:bg-stone-100 border border-stone-900 px-2 py-0.5 rounded"
              >
                + Contoh Gambar & Keterangan
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(
                    'htmlMediaMateri',
                    '<div class="aspect-video w-full rounded overflow-hidden border-2 border-stone-900 shadow-[2px_2px_0px_#1c1917]"><iframe class="w-full h-full" src="https://www.youtube.com/embed/GANTI-ID-VIDEO" title="Video Penjelasan Materi" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
                  )
                }
                className="text-[10px] font-bold text-stone-700 bg-[#FAF7F2] hover:bg-stone-100 border border-stone-900 px-2 py-0.5 rounded"
              >
                + Contoh YouTube Embed
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(
                    'htmlMediaMateri',
                    '<video controls class="w-full rounded border-2 border-stone-900"><source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />Browser Anda tidak mendukung tag video.</video>'
                  )
                }
                className="text-[10px] font-bold text-stone-700 bg-[#FAF7F2] hover:bg-stone-100 border border-stone-900 px-2 py-0.5 rounded"
              >
                + Contoh Video HTML5
              </button>
              <button
                type="button"
                onClick={() => setShowMateriMediaPreview(!showMateriMediaPreview)}
                className="text-[10px] font-bold text-stone-600 underline ml-1"
              >
                {showMateriMediaPreview ? 'Tutup Preview' : 'Buka Preview'}
              </button>
            </div>
          </div>

          <textarea
            rows={3}
            value={data.htmlMediaMateri}
            onChange={(e) => onChange('htmlMediaMateri', e.target.value)}
            placeholder='Tempel kode HTML gambar ilustrasi atau video embed materi disini, contoh: <img src="..." alt="Materi" /> atau <iframe src="https://www.youtube.com/embed/..." ...></iframe>'
            className="w-full px-3 py-2 text-xs font-mono border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none"
          />

          {showMateriMediaPreview && data.htmlMediaMateri && (
            <div className="p-3 border border-stone-900/40 bg-[#FAF7F2] rounded space-y-1.5">
              <span className="text-[10px] font-mono text-stone-600 block font-bold">
                Pratinjau HTML Media Materi:
              </span>
              <div
                className="overflow-hidden rounded border border-dashed border-stone-300 p-2 bg-white"
                dangerouslySetInnerHTML={{ __html: data.htmlMediaMateri }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
