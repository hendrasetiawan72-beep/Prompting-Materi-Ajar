import React from 'react';
import { PromptFormData, AlurItem, InternetCondition } from '../types';
import { ArrowUp, ArrowDown, Check, Monitor, Wifi, Users, ListOrdered } from 'lucide-react';

interface SectionKelasAlurProps {
  data: PromptFormData;
  onChange: <K extends keyof PromptFormData>(field: K, value: PromptFormData[K]) => void;
}

export const SectionKelasAlur: React.FC<SectionKelasAlurProps> = ({
  data,
  onChange,
}) => {
  // Toggle device
  const togglePerangkat = (device: string) => {
    const exists = data.perangkat.includes(device);
    const updated = exists
      ? data.perangkat.filter((d) => d !== device)
      : [...data.perangkat, device];
    onChange('perangkat', updated);
  };

  // Toggle alur item
  const toggleAlurItem = (id: string) => {
    const updated = data.alurList.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    onChange('alurList', updated);
  };

  // Move alur item up or down
  const moveAlurItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.alurList.length) return;

    const list = [...data.alurList];
    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;
    onChange('alurList', list);
  };

  // Update custom note (e.g. URL for slide penutup)
  const updateAlurNote = (id: string, note: string) => {
    const updated = data.alurList.map((item) =>
      item.id === id ? { ...item, customNote: note } : item
    );
    onChange('alurList', updated);
  };

  return (
    <div className="space-y-6">
      {/* 3. KONDISI KELAS */}
      <div className="border-2 border-stone-900 bg-white rounded-lg neo-shadow overflow-hidden">
        <div className="border-b-2 border-stone-900 bg-[#E0F2FE] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-stone-900 bg-white flex items-center justify-center font-bold text-xs neo-shadow-sm">
              3
            </span>
            <h3 className="font-heading font-bold text-sm tracking-tight text-stone-900 uppercase">
              Bagian 3: Kondisi Kelas & Konteks Siswa
            </h3>
          </div>
          <Users className="w-4 h-4 text-sky-900" />
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Perangkat */}
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1.5 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5" />
                Perangkat yang Digunakan
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'HP Siswa',
                  'Laptop Siswa',
                  'Proyektor Kelas',
                  'Lab Komputer',
                  'Chromebook',
                  'Tablet',
                ].map((device) => {
                  const isChecked = data.perangkat.includes(device);
                  return (
                    <button
                      key={device}
                      type="button"
                      onClick={() => togglePerangkat(device)}
                      className={`px-3 py-1.5 text-xs font-bold border-2 border-stone-900 rounded neo-shadow-sm transition-all flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-[#FEF08A] text-stone-900'
                          : 'bg-[#FAF7F2] text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded border border-stone-900 flex items-center justify-center ${
                          isChecked ? 'bg-stone-900 text-white' : 'bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span>{device}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Koneksi Internet */}
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1.5 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" />
                Kondisi Internet Kelas
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['stabil', 'terbatas', 'offline'] as InternetCondition[]).map((cond) => {
                  const isSelected = data.internet === cond;
                  const labelMap: Record<InternetCondition, { title: string; desc: string }> = {
                    stabil: { title: 'Stabil', desc: 'WiFi lancar' },
                    terbatas: { title: 'Terbatas', desc: 'Kuota/Spotty' },
                    offline: { title: 'Offline', desc: 'Tanpa sinyal' },
                  };
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => onChange('internet', cond)}
                      className={`p-2.5 text-left border-2 border-stone-900 rounded neo-shadow-sm transition-all ${
                        isSelected
                          ? 'bg-[#BAE6FD] text-stone-900 font-bold'
                          : 'bg-[#FAF7F2] text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <div className="text-xs capitalize">{labelMap[cond].title}</div>
                      <div className="text-[10px] text-stone-500 font-normal">{labelMap[cond].desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Karakter Siswa & Kendala Belajar
              </label>
              <textarea
                rows={2}
                value={data.karakterSiswaKendala}
                onChange={(e) => onChange('karakterSiswaKendala', e.target.value)}
                placeholder="mis. Antusiasme tinggi pada game/visual, perhatian cepat terdistraksi jika materi terlalu teoritis"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Konteks yang Dekat dengan Siswa
              </label>
              <textarea
                rows={2}
                value={data.konteksDekatSiswa}
                onChange={(e) => onChange('konteksDekatSiswa', e.target.value)}
                placeholder="mis. Dunia kerja kejuruan bengkel/IT, kebiasaan belanja online, isu sampah kantin sekolah"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. ALUR (urutkan, hapus yang tidak perlu) */}
      <div className="border-2 border-stone-900 bg-white rounded-lg neo-shadow overflow-hidden">
        <div className="border-b-2 border-stone-900 bg-[#FED7AA] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-stone-900 bg-white flex items-center justify-center font-bold text-xs neo-shadow-sm">
              4
            </span>
            <h3 className="font-heading font-bold text-sm tracking-tight text-stone-900 uppercase">
              Bagian 4: Alur Belajar (Urutkan & Hapus yang Tidak Perlu)
            </h3>
          </div>
          <ListOrdered className="w-4 h-4 text-amber-900" />
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs text-stone-600 mb-3">
            Centang bagian alur yang ingin disertakan pada slide. Gunakan tombol panah <span className="font-bold">▲ / ▼</span> untuk mengatur urutan slide sesuai alur pedagogik Anda.
          </p>

          <div className="space-y-2">
            {data.alurList.map((item, index) => {
              const isFirst = index === 0;
              const isLast = index === data.alurList.length - 1;
              const isClosing = item.label.includes('Slide penutup');

              return (
                <div
                  key={item.id}
                  className={`p-2.5 border-2 border-stone-900 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                    item.enabled
                      ? 'bg-white neo-shadow-sm'
                      : 'bg-stone-100 opacity-60 border-dashed border-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleAlurItem(item.id)}
                      className={`w-5 h-5 rounded border-2 border-stone-900 flex items-center justify-center shrink-0 transition-colors ${
                        item.enabled ? 'bg-[#FEF08A]' : 'bg-white'
                      }`}
                    >
                      {item.enabled && <Check className="w-3.5 h-3.5 stroke-[3] text-stone-900" />}
                    </button>

                    <span className="text-xs font-mono font-bold text-stone-400 w-5">
                      {index + 1}.
                    </span>

                    <span
                      className={`text-xs font-bold ${
                        item.enabled ? 'text-stone-900' : 'text-stone-400 line-through'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  {/* If closing slide, allow URL input */}
                  {isClosing && item.enabled && (
                    <div className="flex-1 max-w-xs">
                      <input
                        type="text"
                        value={item.customNote || ''}
                        onChange={(e) => updateAlurNote(item.id, e.target.value)}
                        placeholder="URL materi lanjutan / form refleksi (opsional)"
                        className="w-full px-2 py-1 text-xs border border-stone-900 rounded bg-[#FAF7F2]"
                      />
                    </div>
                  )}

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveAlurItem(index, 'up')}
                      title="Geser ke atas"
                      className="p-1 border border-stone-900 rounded bg-[#FAF7F2] hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-stone-100 text-stone-900 transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveAlurItem(index, 'down')}
                      title="Geser ke bawah"
                      className="p-1 border border-stone-900 rounded bg-[#FAF7F2] hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-stone-100 text-stone-900 transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
