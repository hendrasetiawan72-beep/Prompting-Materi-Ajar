import React, { useState, useEffect } from 'react';
import { X, Flame, Wand2, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { PromptFormData, AlurItem } from '../types';
import { DEFAULT_ALUR_LIST } from '../data/presets';

interface AutofillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: Partial<PromptFormData>) => void;
}

export const AutofillModal: React.FC<AutofillModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setiap modal dibuka, kosongkan semua kolom (tidak terisi dari data form)
  useEffect(() => {
    if (isOpen) {
      setTopic('');
      setSubject('');
      setGrade('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTopic = topic.trim();
    if (!cleanTopic) {
      setError('Silakan masukkan topik materi terlebih dahulu.');
      return;
    }

    if (cleanTopic.length < 2) {
      setError('Topik materi terlalu pendek (minimal 2 karakter).');
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      topik: cleanTopic,
      mataPelajaran: subject.trim() || 'Umum',
      jenjangKelas: grade.trim() || 'SMP/SMA',
      // backward compatibility aliases
      topic: cleanTopic,
      subject: subject.trim() || 'Umum',
      grade: grade.trim() || 'SMP/SMA',
    };

    try {
      // Primary endpoint as specified in requirements: /api/kurikulum-ai
      let response: Response;
      try {
        response = await fetch('/api/kurikulum-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (netErr: any) {
        // Fallback attempt to /api/autofill-topic if network routing requires it
        try {
          response = await fetch('/api/autofill-topic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch {
          throw new Error('Gagal menghubungi server AI. Pastikan koneksi internet aktif dan server backend berjalan.');
        }
      }

      // If 404 on /api/kurikulum-ai, fallback to /api/autofill-topic
      if (response.status === 404) {
        response = await fetch('/api/autofill-topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        let errData: any = {};
        try {
          errData = await response.json();
        } catch {
          // ignore html errors
        }

        if (response.status === 503 || errData.code === 'MISSING_API_KEY') {
          throw new Error(
            errData.error ||
              'Secret GROQ_API_KEY (atau GEMINI_API_KEY) belum dikonfigurasi di Cloudflare Worker Secret atau environment server.'
          );
        }

        if (response.status === 429 || errData.code === 'QUOTA_EXHAUSTED' || errData.code === 'RATE_LIMIT_EXCEEDED') {
          throw new Error(
            errData.error ||
              'Batas kuota harian atau frekuensi permintaan AI telah tercapai. Silakan coba kembali beberapa saat lagi.'
          );
        }

        throw new Error(errData.error || `Gagal memanggil asisten kurikulum AI (HTTP ${response.status}).`);
      }

      const resData = await response.json();

      // Validate AI response data structure
      const cptp = resData.tujuanPembelajaran || resData.cptpatp || '';
      const indikator = resData.indikatorBelajar || resData.indikator || '';
      const pengetahuanAwal = resData.kemampuanAwal || resData.pengetahuanAwal || '';

      if (!cptp && !indikator) {
        throw new Error('Respons dari asisten AI tidak memuat data kurikulum yang valid. Silakan coba generate ulang.');
      }

      // Prepare populated alur pembelajaran if provided by AI
      const aiAlurList: string[] = resData.alurMateri || resData.alurRekomendasi || [];
      let updatedAlur: AlurItem[] | undefined;
      if (Array.isArray(aiAlurList) && aiAlurList.length > 0) {
        updatedAlur = DEFAULT_ALUR_LIST.map((item, index) => {
          if (index < aiAlurList.length && typeof aiAlurList[index] === 'string' && aiAlurList[index].trim()) {
            return {
              ...item,
              label: aiAlurList[index].trim(),
              enabled: true,
            };
          }
          return item;
        });
      }

      // Prepare recommended activities array
      const rawAktivitas = resData.rekomendasiAktivitas || resData.aktivitasRekomendasi;
      const normalizedAktivitas: string[] = Array.isArray(rawAktivitas)
        ? rawAktivitas.map((a: any) => String(a).toLowerCase().trim())
        : [];

      // Apply structured suggestions to form
      const formUpdates: Partial<PromptFormData> = {
        mataPelajaran: subject.trim() || 'Umum',
        topikMateri: cleanTopic,
        jenjangKelasFase: grade.trim() || 'SMP/SMA',
        cpTpAtp: cptp,
        indikatorBerhasil: indikator,
        pengetahuanAwalSiswa: pengetahuanAwal,
        pendekatan: resData.pendekatan || '',
        karakterSiswaKendala: resData.karakterSiswa || '',
        konteksDekatSiswa: resData.konteksDekat || '',
      };

      if (normalizedAktivitas.length > 0) {
        formUpdates.aktivitasTerpilih = normalizedAktivitas;
      }

      if (updatedAlur && updatedAlur.length > 0) {
        formUpdates.alurList = updatedAlur;
      }

      onApply(formUpdates);
      onClose();
    } catch (err: any) {
      console.error('Autofill error:', err);
      setError(err.message || 'Terjadi kesalahan saat memanggil asisten kurikulum AI.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg border-2 border-stone-900 bg-white rounded-lg neo-shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="border-b-2 border-stone-900 bg-[#E9D5FF] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded border border-stone-900 bg-white">
              <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-stone-900">
                Auto-Isi Topik Baru dengan AI
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 border border-stone-900 bg-white hover:bg-stone-100 rounded text-stone-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-5 space-y-4">
          <div className="p-3 border-2 border-stone-900 bg-[#FEF08A]/40 rounded text-xs text-stone-700 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Didukung AI Groq (cadangan Gemini) via Cloudflare Worker API</span>
            </div>
            Sebutkan topik materi pembelajaran. AI kurikulum akan merumuskan CP/TP, indikator keberhasilan, kemampuan awal, pendekatan, 8 langkah alur pembelajaran, dan rekomendasi aktivitas secara otomatis.
          </div>

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
            <div className="p-3 border-2 border-rose-900 bg-rose-50 text-rose-900 text-xs rounded font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
            <span className="text-[11px] text-stone-500 font-mono">
              Endpoint: /api/kurikulum-ai
            </span>

            <div className="flex items-center gap-2">
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
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-2 border-stone-900 rounded bg-[#FEF08A] hover:bg-[#fde047] text-stone-900 neo-shadow-sm neo-shadow-hover transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-900" />
                    <span>Merumuskan Kurikulum...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Buatkan Isian Otomatis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
