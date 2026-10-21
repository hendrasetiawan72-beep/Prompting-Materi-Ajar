import React, { useState } from 'react';
import { PromptFormData, AlurItem, InternetCondition } from '../types';
import { DEFAULT_ALUR_LIST } from '../data/presets';
import {
  ArrowUp,
  ArrowDown,
  Check,
  Monitor,
  Wifi,
  Users,
  ListOrdered,
  Plus,
  Trash2,
  RotateCcw,
  Edit3,
  Link2,
  BookOpen,
  Sparkles,
  Flame,
} from 'lucide-react';

interface SectionKelasAlurProps {
  data: PromptFormData;
  onChange: <K extends keyof PromptFormData>(field: K, value: PromptFormData[K]) => void;
}

export const SectionKelasAlur: React.FC<SectionKelasAlurProps> = ({
  data,
  onChange,
}) => {
  const [newStepText, setNewStepText] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Toggle device
  const togglePerangkat = (device: string) => {
    const exists = data.perangkat.includes(device);
    const updated = exists
      ? data.perangkat.filter((d) => d !== device)
      : [...data.perangkat, device];
    onChange('perangkat', updated);
  };

  // Toggle alur item enabled state
  const toggleAlurItem = (id: string) => {
    const updated = data.alurList.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    onChange('alurList', updated);
  };

  // Edit alur label manually
  const updateAlurLabel = (id: string, newLabel: string) => {
    const updated = data.alurList.map((item) =>
      item.id === id ? { ...item, label: newLabel } : item
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

  // Update custom note (e.g. URL for slide penutup / instruksi spesifik)
  const updateAlurNote = (id: string, note: string) => {
    const updated = data.alurList.map((item) =>
      item.id === id ? { ...item, customNote: note } : item
    );
    onChange('alurList', updated);
  };

  // Add new alur item
  const handleAddAlur = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newStepText.trim();
    if (!trimmed) return;

    const newItem: AlurItem = {
      id: 'alur-' + Date.now(),
      label: trimmed,
      enabled: true,
      customNote: '',
    };
    onChange('alurList', [...data.alurList, newItem]);
    setNewStepText('');
  };

  // Delete an alur item
  const deleteAlurItem = (id: string) => {
    const updated = data.alurList.filter((item) => item.id !== id);
    onChange('alurList', updated);
  };

  // Reset to default 10 steps
  const resetAlurList = () => {
    onChange('alurList', DEFAULT_ALUR_LIST);
  };

  // Toggle note visibility for an item
  const toggleNoteVisibility = (id: string) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Apply pedagogical flow presets
  const applyAlurPreset = (type: 'default' | 'pbl' | 'micro' | 'english4skills') => {
    if (type === 'default') {
      onChange('alurList', DEFAULT_ALUR_LIST);
    } else if (type === 'pbl') {
      onChange('alurList', [
        { id: 'pbl-1', label: 'Orientasi Masalah & Pertanyaan Pemantik', enabled: true },
        { id: 'pbl-2', label: 'Eksplorasi Konsep Kunci & Analisis Kasus', enabled: true },
        { id: 'pbl-3', label: 'Desain Perencanaan Proyek Siswa', enabled: true },
        { id: 'pbl-4', label: 'Pengerjaan Proyek Mandiri / Kelompok', enabled: true },
        { id: 'pbl-5', label: 'Presentasi Hasil & Uji Kelayakan Produk', enabled: true },
        { id: 'pbl-6', label: 'Refleksi, Asesmen & Umpan Balik', enabled: true, customNote: '' },
      ]);
    } else if (type === 'micro') {
      onChange('alurList', [
        { id: 'mc-1', label: 'Hook Menarik & Sasaran Kilat (3 Menit)', enabled: true },
        { id: 'mc-2', label: 'Input Konsep Tunggal (Ringkas & Visual)', enabled: true },
        { id: 'mc-3', label: 'Simulasi / Latihan Terbimbing Berpasangan', enabled: true },
        { id: 'mc-4', label: 'Kuis Pemahaman Kilat (Exit Ticket)', enabled: true },
        { id: 'mc-5', label: 'Rangkuman Inti & Tantangan Lanjutan', enabled: true, customNote: '' },
      ]);
    } else if (type === 'english4skills') {
      onChange('alurList', [
        { id: 'en-1', label: 'Lead-in & Listening Trigger (Authentic Audio/Video)', enabled: true },
        { id: 'en-2', label: 'Vocabulary & Language Expressions in Context', enabled: true },
        { id: 'en-3', label: 'Guided Reading & Text Structure Analysis', enabled: true },
        { id: 'en-4', label: 'Interactive Speaking Drill / Pair Role-play', enabled: true },
        { id: 'en-5', label: 'Independent Writing Production & Peer Editing', enabled: true },
        { id: 'en-6', label: 'Wrap-up, Self-Reflection & Next Mission', enabled: true, customNote: '' },
      ]);
    }
  };

  const enabledCount = data.alurList.filter((a) => a.enabled).length;

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

      {/* 4. ALUR (urutkan, edit manual, hapus yang tidak perlu) */}
      <div className="border-2 border-stone-900 bg-white rounded-lg neo-shadow overflow-hidden">
        <div className="border-b-2 border-stone-900 bg-[#FED7AA] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-stone-900 bg-white flex items-center justify-center font-bold text-xs neo-shadow-sm">
              4
            </span>
            <div>
              <h3 className="font-heading font-bold text-sm tracking-tight text-stone-900 uppercase">
                Bagian 4: Alur Belajar (Bisa Diedit Manual, Diurutkan & Dihapus)
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-stone-900 bg-white text-stone-800">
              {enabledCount} dari {data.alurList.length} aktif
            </span>
            <button
              type="button"
              onClick={resetAlurList}
              title="Kembalikan ke 10 alur standar Kurikulum Merdeka"
              className="px-2.5 py-1 text-xs font-bold border border-stone-900 rounded bg-[#FAF7F2] hover:bg-white text-stone-800 flex items-center gap-1.5 transition-colors neo-shadow-sm"
            >
              <RotateCcw className="w-3 h-3 text-stone-700" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
            <p className="text-xs text-stone-600">
              Setiap langkah alur dapat <span className="font-bold text-stone-900">diketik/diedit langsung namanya</span>, diatur urutannya dengan <span className="font-bold text-stone-900">▲/▼</span>, dinonaktifkan centangnya, atau dihapus jika tidak diperlukan.
            </p>

            {/* Template Presets */}
            <div className="flex flex-wrap items-center gap-1 shrink-0">
              <span className="text-[10px] font-bold uppercase text-stone-500 mr-1 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-600" /> Pola:
              </span>
              <button
                type="button"
                onClick={() => applyAlurPreset('default')}
                className="px-2 py-0.5 text-[10px] font-bold rounded border border-stone-800 bg-[#FAF7F2] hover:bg-stone-200 text-stone-800"
              >
                Standar (10)
              </button>
              <button
                type="button"
                onClick={() => applyAlurPreset('pbl')}
                className="px-2 py-0.5 text-[10px] font-bold rounded border border-stone-800 bg-[#FAF7F2] hover:bg-stone-200 text-stone-800"
              >
                PBL (6)
              </button>
              <button
                type="button"
                onClick={() => applyAlurPreset('micro')}
                className="px-2 py-0.5 text-[10px] font-bold rounded border border-stone-800 bg-[#FAF7F2] hover:bg-stone-200 text-stone-800"
              >
                Micro (5)
              </button>
              <button
                type="button"
                onClick={() => applyAlurPreset('english4skills')}
                className="px-2 py-0.5 text-[10px] font-bold rounded border border-stone-800 bg-[#FAF7F2] hover:bg-stone-200 text-stone-800"
              >
                4 Skills (6)
              </button>
            </div>
          </div>

          {/* List of steps */}
          <div className="space-y-2.5">
            {data.alurList.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-stone-300 rounded text-center bg-stone-50">
                <p className="text-xs text-stone-500 mb-2 font-bold">
                  Belum ada langkah alur belajar.
                </p>
                <button
                  type="button"
                  onClick={resetAlurList}
                  className="px-3 py-1.5 text-xs font-bold border-2 border-stone-900 rounded bg-[#FEF08A] hover:bg-amber-300 text-stone-900 neo-shadow-sm"
                >
                  Tampilkan 10 Alur Default
                </button>
              </div>
            ) : (
              data.alurList.map((item, index) => {
                const isFirst = index === 0;
                const isLast = index === data.alurList.length - 1;
                const isClosing = item.label.toLowerCase().includes('slide penutup') || item.label.toLowerCase().includes('tautan');
                const hasNote = item.customNote && item.customNote.trim().length > 0;
                const showNoteInput = isClosing || hasNote || expandedNotes[item.id];

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 sm:p-3 border-2 border-stone-900 rounded transition-all ${
                      item.enabled
                        ? 'bg-white neo-shadow-sm'
                        : 'bg-stone-100 opacity-60 border-dashed border-stone-400'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Checkbox and editable input */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Enable/Disable Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleAlurItem(item.id)}
                          title={item.enabled ? 'Nonaktifkan langkah ini' : 'Aktifkan langkah ini'}
                          className={`w-5 h-5 rounded border-2 border-stone-900 flex items-center justify-center shrink-0 transition-colors ${
                            item.enabled ? 'bg-[#FEF08A]' : 'bg-white'
                          }`}
                        >
                          {item.enabled && <Check className="w-3.5 h-3.5 stroke-[3] text-stone-900" />}
                        </button>

                        {/* Step Number */}
                        <span className="text-xs font-mono font-bold text-stone-500 w-5 text-right shrink-0">
                          {index + 1}.
                        </span>

                        {/* Directly Editable Input */}
                        <div className="relative flex-1 min-w-0">
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => updateAlurLabel(item.id, e.target.value)}
                            placeholder="Ketik nama langkah alur..."
                            className={`w-full text-xs sm:text-sm font-bold px-2 py-1 rounded border transition-colors ${
                              item.enabled
                                ? 'bg-stone-50 hover:bg-stone-100 focus:bg-white text-stone-900 border-stone-200 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900'
                                : 'bg-transparent text-stone-400 line-through border-transparent'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Controls on the right */}
                      <div className="flex items-center justify-end gap-1 shrink-0">
                        {/* Toggle Note / URL button */}
                        <button
                          type="button"
                          onClick={() => toggleNoteVisibility(item.id)}
                          title={showNoteInput ? 'Sembunyikan catatan/URL' : 'Tambah tautan URL / catatan khusus'}
                          className={`p-1.5 border border-stone-900 rounded text-xs transition-colors flex items-center gap-1 ${
                            hasNote || showNoteInput
                              ? 'bg-[#E0F2FE] text-sky-900 font-bold'
                              : 'bg-[#FAF7F2] text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span className="hidden md:inline text-[10px]">
                            {hasNote ? 'URL Terisi' : '+URL/Catatan'}
                          </span>
                        </button>

                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => moveAlurItem(index, 'up')}
                          title="Geser ke atas"
                          className="p-1.5 border border-stone-900 rounded bg-[#FAF7F2] hover:bg-stone-200 disabled:opacity-25 disabled:hover:bg-[#FAF7F2] text-stone-900 transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => moveAlurItem(index, 'down')}
                          title="Geser ke bawah"
                          className="p-1.5 border border-stone-900 rounded bg-[#FAF7F2] hover:bg-stone-200 disabled:opacity-25 disabled:hover:bg-[#FAF7F2] text-stone-900 transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Step */}
                        <button
                          type="button"
                          onClick={() => deleteAlurItem(item.id)}
                          title="Hapus langkah alur ini"
                          className="p-1.5 border border-stone-900 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Note / URL input field if expanded or is closing slide or has note */}
                    {showNoteInput && (
                      <div className="mt-2 pt-2 border-t border-stone-100 flex items-center gap-2 pl-7">
                        <Link2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <input
                          type="text"
                          value={item.customNote || ''}
                          onChange={(e) => updateAlurNote(item.id, e.target.value)}
                          placeholder="Masukkan URL tautan materi lanjutan, form refleksi, atau catatan instruksi khusus..."
                          className="flex-1 px-2.5 py-1 text-xs border border-stone-400 rounded bg-[#FAF7F2] focus:bg-white focus:outline-none focus:border-stone-900"
                        />
                        {hasNote && (
                          <button
                            type="button"
                            onClick={() => updateAlurNote(item.id, '')}
                            title="Kosongkan catatan/URL"
                            className="text-[10px] text-stone-400 hover:text-rose-600 px-1 font-bold"
                          >
                            Hapus URL
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Add New Custom Step Form */}
          <form
            onSubmit={handleAddAlur}
            className="p-3 border-2 border-dashed border-stone-400 rounded-lg bg-[#FFFDF7] flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                placeholder="Ketik nama langkah alur baru... (contoh: Ice Breaking, Studi Kasus Bengkel, Tanya Jawab Cepat)"
                className="w-full px-3 py-2 text-xs sm:text-sm border-2 border-stone-900 rounded bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
            <button
              type="submit"
              disabled={!newStepText.trim()}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold border-2 border-stone-900 rounded bg-[#FEF08A] hover:bg-amber-300 disabled:opacity-40 disabled:hover:bg-[#FEF08A] text-stone-900 flex items-center justify-center gap-1.5 neo-shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Tambah Langkah</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
