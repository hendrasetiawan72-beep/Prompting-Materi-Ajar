import React, { useState, useMemo } from 'react';
import { PromptFormData } from './types';
import { INITIAL_FORM_DATA } from './data/presets';
import { generatePromptInduk } from './utils/promptGenerator';
import { Header } from './components/Header';
import { PresetSelector } from './components/PresetSelector';
import { SectionIdentitas } from './components/SectionIdentitas';
import { SectionKelasAlur } from './components/SectionKelasAlur';
import { SectionAktivitas } from './components/SectionAktivitas';
import { SectionAsesmenOutput } from './components/SectionAsesmenOutput';
import { SectionVisualCatatan } from './components/SectionVisualCatatan';
import { PromptPreviewPanel } from './components/PromptPreviewPanel';
import { AutofillModal } from './components/AutofillModal';
import {
  FileText,
  Flame,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

export default function App() {
  const [formData, setFormData] = useState<PromptFormData>(INITIAL_FORM_DATA);
  const [copied, setCopied] = useState<boolean>(false);
  const [includeSectionsBCD, setIncludeSectionsBCD] = useState<boolean>(true);
  const [cleanUnusedLines, setCleanUnusedLines] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showAllSections, setShowAllSections] = useState<boolean>(false);

  // Modals state
  const [isAutofillOpen, setIsAutofillOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Update a single form field
  const handleFieldChange = <K extends keyof PromptFormData>(
    field: K,
    value: PromptFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Apply a preset or autofill partial data
  const handleApplyPreset = (presetData: Partial<PromptFormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...presetData,
      quizSettings: {
        ...prev.quizSettings,
        ...(presetData.quizSettings || {}),
      },
    }));
    showToast('Template materi ajar berhasil diterapkan!');
  };

  // Reset to empty clean slate
  const handleResetForm = () => {
    if (window.confirm('Apakah Anda yakin ingin mengosongkan form isian?')) {
      setFormData({
        mataPelajaran: '',
        topikMateri: '',
        jenjangKelasFase: '',
        sekolahJurusanKelompok: '',
        durasi: '2 pertemuan × 45 menit',
        bahasaSlide: 'Indonesia',
        bahasaInstruksiSiswa: 'Indonesia santai dan terarah',
        cpTpAtp: 'buatkan yang selaras Kurikulum Merdeka',
        indikatorBerhasil: 'buatkan',
        pengetahuanAwalSiswa: '',
        pendekatan: 'Deep Learning (Mindful, Meaningful, Joyful)',
        perangkat: ['HP Siswa', 'Proyektor'],
        internet: 'stabil',
        karakterSiswaKendala: '',
        konteksDekatSiswa: '',
        alurList: INITIAL_FORM_DATA.alurList,
        aktivitasTerpilih: ['studi kasus singkat', 'think-pair-share', 'kuis interaktif'],
        gameExternalUrl: '',
        jenisAsesmen: 'formatif',
        skemaSkor: 'total 100, bobot per soal',
        hasilAsesmen: 'tidak dikirim',
        quizSettings: {
          web3formKey: '',
          submissionTarget: 'appscript',
          appScriptUrl: '',
          sheetName: 'Nilai_Siswa',
          namaGuru: '',
          bentukSoal: 'pilihan ganda',
          hitungNilaiLangsung: true,
          timerDurasi: true,
          timerMenit: 15,
          antiKopas: true,
          antiTranslate: true,
          antiScreenshot: true,
          singleSubmission: true,
          modeLatihanSetelahKirim: true,
          pantauWaktuBelajar: true,
          pantauKeluarTab: true,
          pantauLayarPenuh: true,
        },
        formatKeluaran: 'C',
        modeKerja: 'langsung jadi',
        jumlahSlide: '10 slide interaktif',
        temaVisual: 'Vintage Postmodernism Neobrutalist Colorful Pastel Elegant',
        paletFont: 'Pastel lembut (vanilla custard, sage mint, peach, lavender) & font sans modern',
        efekSlide: 'Fade Halus & Transisi Modern (Smooth Opacity & Translation)',
        logoGambar: 'placeholder logo',
        htmlLogoSekolah: '',
        htmlBackgroundSekolah: '',
        emojiIkon: 'ya',
        htmlMediaMateri: '',
        htmlMediaSoal: '',
        catatanKhusus: '',
      });
      showToast('Form berhasil di-reset!');
    }
  };

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Master Prompt computation
  const generatedPrompt = useMemo(() => {
    return generatePromptInduk(formData, {
      includeSectionsBCD,
      cleanUnusedLines,
    });
  }, [formData, includeSectionsBCD, cleanUnusedLines]);

  // Copy prompt to clipboard
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    showToast('Prompt Induk berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Download prompt as Markdown (.md)
  const handleDownloadPrompt = () => {
    const filename = `PROMPT-SLIDE-${formData.mataPelajaran || 'MATERI'}-${Date.now()}.md`;
    const blob = new Blob([generatedPrompt], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`File ${filename} berhasil diunduh!`);
  };

  // Section tabs configuration
  const tabs = [
    { title: '1 & 2. Identitas & Tujuan', color: 'bg-[#FEF08A]' },
    { title: '3 & 4. Kondisi & Alur', color: 'bg-[#E0F2FE]' },
    { title: '5. Aktivitas & Media Materi', color: 'bg-[#FCE7F3]' },
    { title: '6 & 7. Asesmen, Media Soal & Output', color: 'bg-[#E9D5FF]' },
    { title: '8 & 9. Visual, Logo & Background', color: 'bg-[#DCFCE7]' },
  ];

  return (
    <div className="min-h-screen flex flex-col vintage-dot-bg">
      {/* Header */}
      <Header
        onCopy={handleCopyPrompt}
        copied={copied}
        onDownload={handleDownloadPrompt}
        onReset={handleResetForm}
      />

      {/* Hero Banner Section */}
      <section className="border-b-2 border-stone-900 bg-[#FAF7F2] py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 border-stone-900 rounded bg-[#FEF08A] neo-shadow-sm mb-3">
                <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
                <span>Format Standar Pembelajaran Berdiferensiasi</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-900 leading-tight">
                Generator Prompt Induk <br className="hidden sm:inline" />
                <span className="font-serif-vintage italic font-normal text-stone-800">
                  Slide Materi Ajar
                </span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-stone-700 leading-relaxed max-w-2xl">
                Bantu guru menyusun slide interaktif Kurikulum Merdeka secara otomatis. Cukup isi <strong className="font-bold text-stone-900">Bagian A</strong> pada formulir di bawah ini — prompt induk akan disusun rapi lengkap dengan aturan tetap Bagian B–D siap ditempel ke AI.
              </p>
            </div>

            {/* Quick KPI Strip / Info Cards */}
            <div className="grid grid-cols-2 gap-2.5 shrink-0 sm:w-auto">
              <div className="p-3 border-2 border-stone-900 bg-[#DCFCE7] rounded-md neo-shadow-sm">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-600 block">
                  Format Keluaran
                </span>
                <span className="font-heading font-bold text-sm text-stone-900 block mt-0.5">
                  {formData.formatKeluaran === 'C' ? 'HTML Interaktif' : `Format ${formData.formatKeluaran}`}
                </span>
                <span className="text-[10px] text-stone-600 mt-1 block">
                  {formData.modeKerja}
                </span>
              </div>

              <div className="p-3 border-2 border-stone-900 bg-[#FED7AA] rounded-md neo-shadow-sm">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-600 block">
                  Menu Aktivitas
                </span>
                <span className="font-heading font-bold text-sm text-stone-900 block mt-0.5 tabular-nums">
                  {formData.aktivitasTerpilih.length} Terpilih
                </span>
                <span className="text-[10px] text-stone-600 mt-1 block">
                  Rekomendasi 3–6
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        {/* Presets Bar */}
        <PresetSelector
          currentData={formData}
          onSelectPreset={handleApplyPreset}
          onOpenAutofill={() => setIsAutofillOpen(true)}
        />

        {/* 2-Column Split: Form Editor (Left) & Live Prompt Panel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* View Mode Switcher: Tabbed vs View All */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white border-2 border-stone-900 rounded-lg neo-shadow-sm">
              <div className="flex flex-wrap gap-1">
                {tabs.map((tab, idx) => {
                  const isActive = !showAllSections && activeTab === idx;
                  return (
                    <button
                      key={tab.title}
                      type="button"
                      onClick={() => {
                        setShowAllSections(false);
                        setActiveTab(idx);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded border-2 border-stone-900 transition-all ${
                        isActive
                          ? `${tab.color} text-stone-900 neo-shadow-sm`
                          : 'bg-[#FAF7F2] text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {tab.title}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowAllSections(!showAllSections)}
                className={`px-3 py-1.5 text-xs font-bold rounded border-2 border-stone-900 transition-all ${
                  showAllSections
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                {showAllSections ? 'Tampilkan Mode Tab' : 'Tampilkan Semua Bagian'}
              </button>
            </div>

            {/* Sections Render */}
            {showAllSections ? (
              <div className="space-y-6">
                <SectionIdentitas
                  data={formData}
                  onChange={handleFieldChange}
                  onOpenAutofill={() => setIsAutofillOpen(true)}
                />
                <SectionKelasAlur data={formData} onChange={handleFieldChange} />
                <SectionAktivitas data={formData} onChange={handleFieldChange} />
                <SectionAsesmenOutput data={formData} onChange={handleFieldChange} />
                <SectionVisualCatatan data={formData} onChange={handleFieldChange} />
              </div>
            ) : (
              <div>
                {activeTab === 0 && (
                  <SectionIdentitas
                    data={formData}
                    onChange={handleFieldChange}
                    onOpenAutofill={() => setIsAutofillOpen(true)}
                  />
                )}
                {activeTab === 1 && (
                  <SectionKelasAlur data={formData} onChange={handleFieldChange} />
                )}
                {activeTab === 2 && (
                  <SectionAktivitas data={formData} onChange={handleFieldChange} />
                )}
                {activeTab === 3 && (
                  <SectionAsesmenOutput data={formData} onChange={handleFieldChange} />
                )}
                {activeTab === 4 && (
                  <SectionVisualCatatan data={formData} onChange={handleFieldChange} />
                )}

                {/* Step navigation buttons */}
                <div className="mt-6 flex items-center justify-between pt-4 border-t-2 border-stone-200">
                  <button
                    type="button"
                    disabled={activeTab === 0}
                    onClick={() => setActiveTab((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 text-xs font-bold border-2 border-stone-900 rounded bg-white hover:bg-stone-100 disabled:opacity-40 transition-colors"
                  >
                    ← Bagian Sebelumnya
                  </button>

                  <div className="text-xs font-mono font-bold text-stone-500">
                    Langkah {activeTab + 1} dari {tabs.length}
                  </div>

                  <button
                    type="button"
                    disabled={activeTab === tabs.length - 1}
                    onClick={() => setActiveTab((prev) => Math.min(tabs.length - 1, prev + 1))}
                    className="px-4 py-2 text-xs font-bold border-2 border-stone-900 rounded bg-[#FEF08A] hover:bg-[#fde047] disabled:opacity-40 neo-shadow-sm transition-all"
                  >
                    Lanjut Berikutnya →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Master Prompt Output (5 cols) */}
          <div className="lg:col-span-5">
            <PromptPreviewPanel
              promptText={generatedPrompt}
              onCopy={handleCopyPrompt}
              copied={copied}
              onDownload={handleDownloadPrompt}
              includeSectionsBCD={includeSectionsBCD}
              onToggleBCD={setIncludeSectionsBCD}
              cleanUnusedLines={cleanUnusedLines}
              onToggleCleanLines={setCleanUnusedLines}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t-2 border-stone-900 bg-white py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-stone-900 bg-[#FEF08A] flex items-center justify-center font-bold text-[10px]">
              ✏️
            </div>
            <span>
              Generator Prompt Induk Slide Materi Ajar — Format Kurikulum Merdeka & Deep Learning
              </span>
             <b>Developed by @hndx07</b> 
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Bagian A: Isian Guru</span>
            <span>·</span>
            <span>Bagian B: Aturan Tetap</span>
            <span>·</span>
            <span>Bagian C: HTML Interaktif</span>
            <span>·</span>
            <span>Bagian D: Format Jawaban</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 border-2 border-stone-900 bg-[#FEF08A] text-stone-900 px-4 py-2.5 rounded-lg neo-shadow flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-800" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* AI Autofill Modal */}
      <AutofillModal
        isOpen={isAutofillOpen}
        onClose={() => setIsAutofillOpen(false)}
        onApply={handleApplyPreset}
        initialTopic={formData.topikMateri}
        initialSubject={formData.mataPelajaran}
        initialGrade={formData.jenjangKelasFase}
      />
    </div>
  );
}
