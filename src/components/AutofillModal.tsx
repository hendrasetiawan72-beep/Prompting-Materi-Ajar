import React, { useState } from 'react';
import { X, Flame, Wand2, Loader2, Check } from 'lucide-react';
import { PromptFormData } from '../types';

interface AutofillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: Partial<PromptFormData>) => void;
  initialTopic: string;
  initialSubject: string;
  initialGrade: string;
}

export const AutofillModal: React.FC<AutofillModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialTopic,
  initialSubject,
  initialGrade,
}) => {
  const [topic, setTopic] = useState(initialTopic || '');
  const [subject, setSubject] = useState(initialSubject || '');
  const [grade, setGrade] = useState(initialGrade || 'SMP Kelas VIII, Fase D');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Silakan masukkan topik materi terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/autofill-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, subject, grade }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal memanggil asisten kurikulum AI');
      }

      const resData = await response.json();

      // Apply suggestions to form
      onApply({
        mataPelajaran: subject || 'Umum',
        topikMateri: topic,
        jenjangKelasFase: grade,
        cpTpAtp: resData.cptpatp || '',
        indikatorBerhasil: resData.indikator || '',
        pengetahuanAwalSiswa: resData.pengetahuanAwal || '',
        pendekatan: resData.pendekatan || '',
        karakterSiswaKendala: resData.karakterSiswa || '',
        konteksDekatSiswa: resData.konteksDekat || '',
        ...(resData.aktivitasRekomendasi && Array.isArray(resData.aktivitasRekomendasi)
          ? { aktivitasTerpilih: resData.aktivitasRekomendasi }
          : {}),
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghubungi server AI.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg border-2 border-stone-900 bg-white rounded-lg neo-shadow-lg overflow-hidden">
        {/* Header */}
        <div className="border-b-2 border-stone-900 bg-[#E9D5FF] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded border border-stone-900 bg-white">
              <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
            </div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-stone-900">
              Auto-Isi Topik Baru dengan AI
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 border border-stone-900 bg-white hover:bg-stone-100 rounded text-stone-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-5 space-y-4">
          <p className="text-xs text-stone-600">
            Cukup sebutkan topik pelajaran Anda. AI akan merumuskan Capaian Pembelajaran (CP/TP), indikator keberhasilan, prasyarat, alur, dan rekomendasi aktivitas secara otomatis.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
              Topik / Materi Pembelajaran <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="mis. Fotosintesis, Teks Debat, Hukum Newton, Keamanan Siber"
              className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white font-medium"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="mis. IPA, Bahasa Indonesia"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Jenjang / Kelas
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="mis. SMP Kelas VII, Fase D"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 border-2 border-rose-900 bg-rose-50 text-rose-900 text-xs rounded font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="pt-2 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold border-2 border-stone-900 rounded bg-white hover:bg-stone-100 text-stone-800 transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-2 border-stone-900 rounded bg-[#FEF08A] hover:bg-[#fde047] text-stone-900 neo-shadow-sm neo-shadow-hover transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Merumuskan Isian...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Buatkan Isian Otomatis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
