import React, { useState } from 'react';
import { PromptFormData, AssessmentType, SubmissionType, OutputFormatType, WorkModeType } from '../types';
import {
  ShieldAlert,
  Award,
  FileCode,
  Clock,
  Lock,
  Send,
  Layers,
  Image,
  Video,
  Eye,
  FileSpreadsheet,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface SectionAsesmenOutputProps {
  data: PromptFormData;
  onChange: <K extends keyof PromptFormData>(field: K, value: PromptFormData[K]) => void;
}

export const SectionAsesmenOutput: React.FC<SectionAsesmenOutputProps> = ({
  data,
  onChange,
}) => {
  const [showSoalMediaPreview, setShowSoalMediaPreview] = useState(true);
  const [showScriptHelper, setShowScriptHelper] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const updateQuiz = (key: keyof PromptFormData['quizSettings'], value: any) => {
    onChange('quizSettings', {
      ...data.quizSettings,
      [key]: value,
    });
  };

  const appScriptCode = `// KODE GOOGLE APPS SCRIPT (doPost)
// 1. Buat Google Spreadsheet baru
// 2. Klik menu Ekstensi > Apps Script
// 3. Hapus kode bawaan dan tempel kode berikut:

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "${data.quizSettings.sheetName || 'Nilai_Siswa'}";
    var sheet = ss.getSheetByName(sheetName) || ss.getActiveSheet();
    
    // Header otomatis jika baris masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Nama Siswa", "Kelas", "Skor", "Lama Pengerjaan", "Jawaban / Esai"]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#FEF08A");
    }
    
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      new Date(),
      data.nama || "",
      data.kelas || "",
      data.skor || 0,
      data.lamaPengerjaan || "",
      typeof data.jawaban === "object" ? JSON.stringify(data.jawaban) : (data.jawaban || data.esai || "")
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data berhasil disimpan ke Spreadsheet!" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 4. Klik Terapkan (Deploy) > Deployment baru
// 5. Pilih jenis "Aplikasi Web" (Web app)
// 6. Pada "Akses" (Who has access), pilih "Siapa saja" (Anyone)
// 7. Salin URL yang dihasilkan (berakhiran /exec) dan tempel ke kolom di aplikasi ini.`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 6. ASESMEN */}
      <div className="border-2 border-stone-900 bg-white rounded-lg neo-shadow overflow-hidden">
        <div className="border-b-2 border-stone-900 bg-[#E9D5FF] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-stone-900 bg-white flex items-center justify-center font-bold text-xs neo-shadow-sm">
              6
            </span>
            <h3 className="font-heading font-bold text-sm tracking-tight text-stone-900 uppercase">
              Bagian 6: Asesmen, Format Kuis & Pengiriman Nilai
            </h3>
          </div>
          <Award className="w-4 h-4 text-purple-900" />
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Jenis Asesmen */}
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Jenis Asesmen
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['diagnostik', 'formatif', 'sumatif'] as AssessmentType[]).map((jenis) => (
                  <button
                    key={jenis}
                    type="button"
                    onClick={() => onChange('jenisAsesmen', jenis)}
                    className={`px-2 py-1.5 text-xs font-bold border-2 border-stone-900 rounded capitalize transition-all ${
                      data.jenisAsesmen === jenis
                        ? 'bg-[#FEF08A] text-stone-900 neo-shadow-sm'
                        : 'bg-[#FAF7F2] text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {jenis}
                  </button>
                ))}
              </div>
            </div>

            {/* Skema Skor */}
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Skema Skor
              </label>
              <input
                type="text"
                value={data.skemaSkor}
                onChange={(e) => onChange('skemaSkor', e.target.value)}
                placeholder="mis. total 100, bobot per soal, atau tanpa skor"
                className="w-full px-3 py-1.5 text-xs border-2 border-stone-900 rounded bg-[#FAF7F2]"
              />
            </div>

            {/* Pengiriman Hasil */}
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Pengiriman Hasil
              </label>
              <select
                value={data.hasilAsesmen}
                onChange={(e) => onChange('hasilAsesmen', e.target.value as SubmissionType)}
                className="w-full px-3 py-1.5 text-xs border-2 border-stone-900 rounded bg-[#FAF7F2] font-medium"
              >
                <option value="tidak dikirim">Tidak dikirim</option>
                <option value="dikirim ke guru lewat formulir">Dikirim ke guru lewat formulir</option>
                <option value="lokal saja">Lokal saja (di perangkat)</option>
              </select>
            </div>
          </div>

          {/* Pengaturan Kuis & Submission ke Google Spreadsheet / Web3forms */}
          <div className="p-3.5 border-2 border-stone-900 bg-[#FAF7F2] rounded-md space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h4 className="font-heading font-bold text-xs uppercase text-stone-900">
                  Target Pengiriman Nilai & Formulir Interaktif
                </h4>
              </div>

              {/* Selector Target Submission */}
              <div className="flex items-center gap-1 bg-white p-1 border border-stone-900 rounded text-xs">
                {[
                  { id: 'appscript' as const, label: 'Google Spreadsheet', icon: FileSpreadsheet },
                  { id: 'web3forms' as const, label: 'Web3forms (Email)', icon: Send },
                  { id: 'both' as const, label: 'Keduanya', icon: Layers },
                ].map((tgt) => {
                  const isSel = data.quizSettings.submissionTarget === tgt.id;
                  const Icon = tgt.icon;
                  return (
                    <button
                      key={tgt.id}
                      type="button"
                      onClick={() => updateQuiz('submissionTarget', tgt.id)}
                      className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                        isSel
                          ? 'bg-[#FEF08A] text-stone-900 shadow-xs border border-stone-900'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{tgt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Nama Guru Penerima Laporan
                </label>
                <input
                  type="text"
                  value={data.quizSettings.namaGuru}
                  onChange={(e) => updateQuiz('namaGuru', e.target.value)}
                  placeholder="mis. Ibu Ratna Sari, M.Pd."
                  className="w-full px-3 py-1.5 text-xs border-2 border-stone-900 rounded bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Bentuk Soal Kuis
                </label>
                <select
                  value={data.quizSettings.bentukSoal}
                  onChange={(e) => updateQuiz('bentukSoal', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border-2 border-stone-900 rounded bg-white font-medium"
                >
                  <option value="pilihan ganda">Pilihan Ganda</option>
                  <option value="essay">Essay / Uraian</option>
                  <option value="campuran pilihan ganda & essay">Campuran Pilihan Ganda & Essay</option>
                </select>
              </div>
            </div>

            {/* GOOGLE SPREADSHEET / APPS SCRIPT CONFIGURATION */}
            {(data.quizSettings.submissionTarget === 'appscript' ||
              data.quizSettings.submissionTarget === 'both') && (
              <div className="p-3 bg-white border-2 border-emerald-800 rounded-md space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold uppercase text-stone-900">
                      Integrasi Google Spreadsheet (Apps Script Webhook)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowScriptHelper(!showScriptHelper)}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 underline flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showScriptHelper ? 'Tutup Kode Apps Script' : 'Salin Kode Google Apps Script'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                      URL Web App Google Apps Script (Berakhiran /exec)
                    </label>
                    <input
                      type="url"
                      value={data.quizSettings.appScriptUrl}
                      onChange={(e) => updateQuiz('appScriptUrl', e.target.value)}
                      placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                      className="w-full px-3 py-1.5 text-xs font-mono border-2 border-stone-900 rounded bg-[#FAF7F2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                      Nama Sheet di Google Spreadsheet
                    </label>
                    <input
                      type="text"
                      value={data.quizSettings.sheetName}
                      onChange={(e) => updateQuiz('sheetName', e.target.value)}
                      placeholder="mis. Nilai_Siswa"
                      className="w-full px-3 py-1.5 text-xs font-mono border-2 border-stone-900 rounded bg-[#FAF7F2]"
                    />
                  </div>
                </div>

                {/* Apps Script Code Helper Box */}
                {showScriptHelper && (
                  <div className="mt-2 p-3 bg-stone-900 text-stone-100 rounded text-xs font-mono space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-amber-300 font-bold">
                        📄 Kode doPost Google Apps Script Siap Tempel:
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyScript}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-[#FEF08A] text-stone-900 rounded hover:bg-[#fde047] transition-colors"
                      >
                        {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Tersalin!' : 'Salin Kode Script'}</span>
                      </button>
                    </div>
                    <pre className="p-2 bg-stone-950 rounded text-[11px] leading-relaxed overflow-x-auto text-emerald-400">
                      {appScriptCode}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* WEB3FORMS CONFIGURATION */}
            {(data.quizSettings.submissionTarget === 'web3forms' ||
              data.quizSettings.submissionTarget === 'both') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-800">
                    Access Key Web3forms (Kirim Nilai ke Email Guru)
                  </label>
                  <a
                    href="https://web3forms.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-purple-700 underline font-medium hover:text-purple-900 flex items-center gap-1"
                  >
                    <span>Dapatkan Key Gratis di Web3forms.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="text"
                  value={data.quizSettings.web3formKey}
                  onChange={(e) => updateQuiz('web3formKey', e.target.value)}
                  placeholder="Tempel Access Key Web3forms disini (mis. a1b2c3d4-e5f6-7890-...)"
                  className="w-full px-3 py-1.5 text-xs font-mono border-2 border-stone-900 rounded bg-white"
                />
              </div>
            )}

            {/* KOLOM HTML: GAMBAR / VIDEO UNTUK SOAL KUIS */}
            <div className="pt-2 border-t border-stone-300 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase text-stone-900 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-purple-800" />
                  Kolom HTML Gambar / Video Soal Kuis (Stimulus Soal)
                </label>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onChange(
                        'htmlMediaSoal',
                        '<div class="p-2 border border-rose-300 bg-rose-50 rounded text-center"><img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80" alt="Kasus Soal Analisis URL Palsu" class="mx-auto h-36 object-cover rounded mb-1" /><span class="text-[11px] font-mono text-stone-700">Perhatikan tangkapan layar domain di atas untuk menjawab soal nomor 1-3.</span></div>'
                      )
                    }
                    className="text-[10px] font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-900 px-2 py-0.5 rounded"
                  >
                    + Contoh Gambar Soal
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChange(
                        'htmlMediaSoal',
                        '<div class="aspect-video w-full max-w-md mx-auto my-2 rounded overflow-hidden border border-stone-900"><iframe class="w-full h-full" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Video Kasus Soal" allowfullscreen></iframe></div>'
                      )
                    }
                    className="text-[10px] font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-900 px-2 py-0.5 rounded"
                  >
                    + Contoh Video Soal
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSoalMediaPreview(!showSoalMediaPreview)}
                    className="text-[10px] font-bold text-stone-600 underline ml-1"
                  >
                    {showSoalMediaPreview ? 'Tutup Preview' : 'Buka Preview'}
                  </button>
                </div>
              </div>

              <textarea
                rows={2}
                value={data.htmlMediaSoal}
                onChange={(e) => onChange('htmlMediaSoal', e.target.value)}
                placeholder='Tempel kode HTML gambar diagram atau video soal disini, contoh: <img src="https://..." alt="Gambar Soal" /> atau <iframe src="..." ...></iframe>'
                className="w-full px-3 py-1.5 text-xs font-mono border-2 border-stone-900 rounded bg-white focus:outline-none"
              />

              {showSoalMediaPreview && data.htmlMediaSoal && (
                <div className="p-2.5 border border-stone-900/40 bg-white rounded space-y-1">
                  <span className="text-[10px] font-mono text-stone-500 block">Pratinjau HTML Media Soal:</span>
                  <div
                    className="overflow-hidden rounded border border-dashed border-stone-300 p-2"
                    dangerouslySetInnerHTML={{ __html: data.htmlMediaSoal }}
                  />
                </div>
              )}
            </div>

            {/* Proteksi Switches */}
            <div className="pt-2 border-t border-stone-300">
              <span className="block text-xs font-bold uppercase text-stone-800 mb-2">
                Fitur Keamanan & Pembatasan Siswa
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  {
                    key: 'hitungNilaiLangsung' as const,
                    label: 'Hitung Nilai Langsung',
                    desc: 'Otomatis kalkulasi skor akhir',
                  },
                  {
                    key: 'timerDurasi' as const,
                    label: 'Timer Pengerjaan',
                    desc: `${data.quizSettings.timerMenit} Menit hitung mundur`,
                  },
                  {
                    key: 'antiKopas' as const,
                    label: 'Tidak Bisa Kopas',
                    desc: 'Disable copy, paste & select',
                  },
                  {
                    key: 'antiTranslate' as const,
                    label: 'Tidak Bisa Translate',
                    desc: 'Cegah translate otomatis browser',
                  },
                  {
                    key: 'antiScreenshot' as const,
                    label: 'Tidak Bisa Screenshot',
                    desc: 'Watermark & blur proteksi layar',
                  },
                  {
                    key: 'singleSubmission' as const,
                    label: 'Hanya 1x Kirim',
                    desc: 'Terkunci setelah notifikasi terkirim',
                  },
                  {
                    key: 'modeLatihanSetelahKirim' as const,
                    label: 'Mode Latihan Pasca-Kirim',
                    desc: 'Bisa latihan ulang tanpa ubah nilai resmi',
                  },
                ].map((sec) => {
                  const val = data.quizSettings[sec.key];
                  return (
                    <button
                      key={sec.key}
                      type="button"
                      onClick={() => updateQuiz(sec.key, !val)}
                      className={`p-2 text-left border-2 border-stone-900 rounded transition-all flex items-start gap-2 ${
                        val
                          ? 'bg-[#DCFCE7] text-stone-900 font-bold neo-shadow-sm'
                          : 'bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded border border-stone-900 flex items-center justify-center shrink-0 mt-0.5 ${
                          val ? 'bg-stone-900 text-white' : 'bg-white'
                        }`}
                      >
                        {val && <Lock className="w-2.5 h-2.5" />}
                      </div>
                      <div>
                        <div className="text-xs">{sec.label}</div>
                        <div className="text-[10px] text-stone-500 font-normal">{sec.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Timer input if timer is active */}
              {data.quizSettings.timerDurasi && (
                <div className="mt-2.5 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-stone-600" />
                  <span className="text-xs font-bold text-stone-800">Durasi Timer:</span>
                  <input
                    type="number"
                    min={3}
                    max={120}
                    value={data.quizSettings.timerMenit}
                    onChange={(e) => updateQuiz('timerMenit', parseInt(e.target.value) || 15)}
                    className="w-16 px-2 py-1 text-xs border-2 border-stone-900 rounded bg-white text-center font-bold"
                  />
                  <span className="text-xs text-stone-600">menit</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 7. FORMAT KELUARAN */}
      <div className="border-2 border-stone-900 bg-white rounded-lg neo-shadow overflow-hidden">
        <div className="border-b-2 border-stone-900 bg-[#BAE6FD] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-stone-900 bg-white flex items-center justify-center font-bold text-xs neo-shadow-sm">
              7
            </span>
            <h3 className="font-heading font-bold text-sm tracking-tight text-stone-900 uppercase">
              Bagian 7: Format Keluaran Slide & Mode Kerja
            </h3>
          </div>
          <FileCode className="w-4 h-4 text-sky-900" />
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-stone-800 mb-2">
              Pilih Satu Format Keluaran:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'A' as OutputFormatType,
                  title: 'A. Peta Slide Saja (Tabel)',
                  desc: 'Hanya menghasilkan tabel alur, durasi, aktivitas, dan bukti belajar.',
                  badge: 'Perencanaan',
                },
                {
                  id: 'B' as OutputFormatType,
                  title: 'B. Naskah Isi Tiap Slide + Catatan Guru',
                  desc: 'Naskah teks lengkap per slide beserta panduan fasilitasi guru.',
                  badge: 'Naskah PPT',
                },
                {
                  id: 'C' as OutputFormatType,
                  title: 'C. HTML Interaktif Satu File (Aktifkan Bagian C)',
                  desc: 'Slide web responsif mandiri, support swipe, kuis, full-screen, Google Sheets submission, dan anti-cheat.',
                  badge: 'Paling Populer',
                  popular: true,
                },
                {
                  id: 'D' as OutputFormatType,
                  title: 'D. Kerangka PPTX / Google Slides',
                  desc: 'Format markdown siap impor ke Presentasi Google / PowerPoint.',
                  badge: 'Presentasi',
                },
              ].map((opt) => {
                const isSelected = data.formatKeluaran === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange('formatKeluaran', opt.id)}
                    className={`p-3 text-left border-2 border-stone-900 rounded-md transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#FEF08A] font-bold text-stone-900 neo-shadow'
                        : 'bg-[#FAF7F2] text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-heading font-bold text-xs text-stone-900">
                          {opt.title}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-mono px-1.5 py-0.5 border border-stone-900 rounded ${
                            opt.popular ? 'bg-[#DCFCE7]' : 'bg-white'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 font-normal leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>

                    {opt.id === 'C' && (
                      <div className="mt-2 text-[10px] text-emerald-800 font-mono font-bold">
                        ⚡ Otomatis mengaktifkan aturan teknis Bagian C & pengiriman Google Spreadsheet
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Mode Kerja AI
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    val: 'rancangan dulu, tunggu persetujuan' as WorkModeType,
                    label: 'Rancangan Dulu',
                    desc: 'Tanya lanjut/revisi setelah tabel',
                  },
                  {
                    val: 'langsung jadi' as WorkModeType,
                    label: 'Langsung Jadi',
                    desc: 'Langsung selesaikan seluruh tahap',
                  },
                ].map((mode) => (
                  <button
                    key={mode.val}
                    type="button"
                    onClick={() => onChange('modeKerja', mode.val)}
                    className={`p-2 text-left border-2 border-stone-900 rounded transition-all ${
                      data.modeKerja === mode.val
                        ? 'bg-[#DCFCE7] text-stone-900 font-bold neo-shadow-sm'
                        : 'bg-[#FAF7F2] text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className="text-xs">{mode.label}</div>
                    <div className="text-[10px] text-stone-500 font-normal">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-800 mb-1">
                Target Jumlah Slide
              </label>
              <input
                type="text"
                value={data.jumlahSlide}
                onChange={(e) => onChange('jumlahSlide', e.target.value)}
                placeholder="mis. 8 slide, 10-12 slide, atau sesuai kebutuhan, maks 10"
                className="w-full px-3 py-2 text-sm border-2 border-stone-900 rounded bg-[#FAF7F2] focus:bg-white"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['8 slide', '10 slide interaktif', '12 slide', 'sesuai kebutuhan, maks 10'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChange('jumlahSlide', s)}
                    className="text-[10px] font-medium px-1.5 py-0.5 bg-stone-100 hover:bg-[#BAE6FD] border border-stone-300 rounded transition-colors"
                  >
                    {s}
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
