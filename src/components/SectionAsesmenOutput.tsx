import React, { useState } from 'react';
import { PromptFormData, AssessmentType, SubmissionType, OutputFormatType, WorkModeType, BentukSoalType } from '../types';
import { BENTUK_SOAL_OPTIONS, normalizeBentukSoal } from '../data/presets';
import { AiMediaPanel } from './AiMediaPanel';
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
  Maximize,
  RotateCcw,
  Activity,
  Users,
  CheckCircle2,
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

  // Bentuk soal boleh dipilih lebih dari satu (minimal satu bentuk tetap terpilih)
  const selectedBentuk = normalizeBentukSoal(data.quizSettings.bentukSoal);
  const hasBentuk = (id: BentukSoalType) => selectedBentuk.includes(id);
  const toggleBentuk = (id: BentukSoalType) => {
    const next = BENTUK_SOAL_OPTIONS.map((o) => o.id).filter((x) =>
      x === id ? !hasBentuk(id) : hasBentuk(x)
    );
    if (next.length === 0) return;
    updateQuiz('bentukSoal', next);
  };

  const appScriptCode = `// KODE GOOGLE APPS SCRIPT (doPost) DENGAN LOCKSERVICE 20 DETIK & CEK KUNCI SATU KALI KIRIM
// 1. Buat Google Spreadsheet baru
// 2. Klik menu Ekstensi > Apps Script
// 3. Hapus kode bawaan dan tempel kode berikut:

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Kunci proses maksimal 20 detik untuk mencegah race condition / klik ganda
    lock.waitLock(20000);
  } catch (lockError) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      message: "Server sibuk memproses pengiriman lain. Silakan coba sesaat lagi."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "${data.quizSettings.sheetName || 'Nilai_Siswa'}";
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Header otomatis jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Kunci",
        "Nama Siswa",
        "Kelas",
        "Skor",
        "Lama Pengerjaan",
        "Waktu Per Langkah (8 Langkah)",
        "Keluar Tab (Frekuensi)",
        "Keluar Tab (Total Detik)",
        "Log Keluar Tab",
        "Keluar Fullscreen (Frekuensi)",
        "Jawaban / Esai / Refleksi"
      ]);
      sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#FEF08A");
      sheet.setFrozenRows(1);
    }

    var data = JSON.parse(e.postData.contents);
    
    // Normalisasi Kunci identifikasi unik = nama + kelas (huruf kecil, spasi dirapikan)
    var namaClean = String(data.nama || "").trim().toLowerCase().replace(/\\s+/g, " ");
    var kelasClean = String(data.kelas || "").trim().toLowerCase().replace(/\\s+/g, " ");
    var normKey = data.kunci ? String(data.kunci).trim().toLowerCase().replace(/\\s+/g, " ") : (namaClean + "_" + kelasClean);

    // Cek duplikasi di kolom Kunci (Kolom 2)
    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      var rowKey = String(values[i][1]).trim().toLowerCase().replace(/\\s+/g, " ");
      if (rowKey === normKey && normKey !== "") {
        // Jika duplikat, server membalas {ok:false, dup:true} dan widget masuk mode latihan
        return ContentService.createTextOutput(JSON.stringify({
          ok: false,
          dup: true,
          message: "Siswa dengan nama dan kelas ini sudah pernah mengirim tugas resmi. Nilai tidak dapat diubah lagi."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Format data pemantauan
    var durasiLangkahStr = typeof data.durasiPerLangkah === "object" ? JSON.stringify(data.durasiPerLangkah) : String(data.durasiPerLangkah || "");
    var tabLogStr = typeof data.keluarTabLog === "object" ? JSON.stringify(data.keluarTabLog) : String(data.keluarTabLog || "");
    var jawabanStr = typeof data.jawaban === "object" ? JSON.stringify(data.jawaban) : String(data.jawaban || data.esai || "");

    // Simpan baris baru ke spreadsheet
    sheet.appendRow([
      new Date(),
      normKey,
      data.nama || "",
      data.kelas || "",
      data.skor !== undefined ? data.skor : 0,
      data.lamaPengerjaan || data.durasiTotal || "",
      durasiLangkahStr,
      data.keluarTabCount || 0,
      data.keluarTabDurasi || 0,
      tabLogStr,
      data.keluarFullscreenCount || 0,
      jawabanStr
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      status: "success",
      message: "Data tugas dan pemantauan belajar berhasil dicatat di Spreadsheet!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    // Selalu lepaskan lock
    lock.releaseLock();
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
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label className="block text-xs font-bold text-stone-800">
                  Bentuk Soal Kuis{' '}
                  <span className="font-normal text-stone-500">(boleh pilih lebih dari satu)</span>
                </label>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="font-mono text-stone-600">{selectedBentuk.length} bentuk dipilih</span>
                  <button
                    type="button"
                    onClick={() => updateQuiz('bentukSoal', BENTUK_SOAL_OPTIONS.map((o) => o.id))}
                    className="font-bold underline text-stone-700 hover:text-stone-900"
                  >
                    Pilih semua
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {BENTUK_SOAL_OPTIONS.map((opt) => {
                  const checked = hasBentuk(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-2 px-2.5 py-1.5 text-xs border-2 border-stone-900 rounded cursor-pointer transition-colors ${
                        checked ? 'bg-[#FEF08A]' : 'bg-white hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleBentuk(opt.id)}
                        className="mt-0.5 rounded border-stone-900 text-stone-900 focus:ring-0"
                      />
                      <span>
                        <span className="font-bold text-stone-900">{opt.label}</span>
                        <span className="block text-[10px] text-stone-600">{opt.hint}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Informational Callout Card for MCMA & PG Kompleks Kategori 3 Pernyataan */}
            {(hasBentuk('mcma') || hasBentuk('pg_kompleks_kategori_3')) && (
              <div className="p-3 bg-[#EFF6FF] border-2 border-blue-900 rounded-md text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-950">
                  <ShieldAlert className="w-4 h-4 text-blue-700" />
                  <span>Panduan Bentuk Soal Interaktif AKM / Kurikulum Merdeka</span>
                </div>

                {hasBentuk('mcma') && (
                  <div className="bg-white p-2.5 rounded border border-blue-300 space-y-1">
                    <span className="font-bold text-blue-900 flex items-center gap-1 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                      Format MCMA (Multiple Choice Multiple Answer)
                    </span>
                    <p className="text-[11px] text-stone-700 leading-relaxed">
                      Siswa diberikan stimulus pertanyaan dan pilihan dengan elemen <strong>checkbox</strong> (<code className="text-blue-800 bg-blue-50 px-1 py-0.5 rounded">&lt;input type="checkbox"&gt;</code>). Terdapat lebih dari 1 opsi benar (misal memilih 2 dari 4, atau 3 dari 5 pilihan). Dilengkapi instruksi jelas jumlah opsi yang harus dicentang dan penilaian proporsional.
                    </p>
                  </div>
                )}

                {hasBentuk('pg_kompleks_kategori_3') && (
                  <div className="bg-white p-2.5 rounded border border-blue-300 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 flex items-center gap-1 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                        Format PG Kompleks Kategori (Tabel 3 Pernyataan)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onChange(
                            'htmlMediaSoal',
                            `<div class="p-3 border-2 border-stone-900 bg-white rounded-lg neo-shadow-sm my-2">
  <p class="text-xs font-bold text-stone-900 mb-2">Berdasarkan teks/materi di atas, tentukan kategori Benar atau Salah untuk setiap pernyataan berikut:</p>
  <div class="overflow-x-auto">
    <table class="w-full text-xs text-left border-collapse border border-stone-800">
      <thead>
        <tr class="bg-amber-100 border-b border-stone-800">
          <th class="p-2 border-r border-stone-800 w-8 text-center font-bold">No</th>
          <th class="p-2 border-r border-stone-800 font-bold">Butir Pernyataan</th>
          <th class="p-2 border-r border-stone-800 w-16 text-center font-bold">Benar</th>
          <th class="p-2 w-16 text-center font-bold">Salah</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b border-stone-300 hover:bg-stone-50">
          <td class="p-2 border-r border-stone-800 text-center font-bold">1</td>
          <td class="p-2 border-r border-stone-800">Pernyataan stimulus kesatu terkait materi ajar...</td>
          <td class="p-2 border-r border-stone-800 text-center"><input type="radio" name="pgk_p1" value="benar" class="w-4 h-4 cursor-pointer" /></td>
          <td class="p-2 text-center"><input type="radio" name="pgk_p1" value="salah" class="w-4 h-4 cursor-pointer" /></td>
        </tr>
        <tr class="border-b border-stone-300 hover:bg-stone-50">
          <td class="p-2 border-r border-stone-800 text-center font-bold">2</td>
          <td class="p-2 border-r border-stone-800">Pernyataan stimulus kedua terkait konsep atau data...</td>
          <td class="p-2 border-r border-stone-800 text-center"><input type="radio" name="pgk_p2" value="benar" class="w-4 h-4 cursor-pointer" /></td>
          <td class="p-2 text-center"><input type="radio" name="pgk_p2" value="salah" class="w-4 h-4 cursor-pointer" /></td>
        </tr>
        <tr class="hover:bg-stone-50">
          <td class="p-2 border-r border-stone-800 text-center font-bold">3</td>
          <td class="p-2 border-r border-stone-800">Pernyataan stimulus ketiga yang menguji pemahaman kritis...</td>
          <td class="p-2 border-r border-stone-800 text-center"><input type="radio" name="pgk_p3" value="benar" class="w-4 h-4 cursor-pointer" /></td>
          <td class="p-2 text-center"><input type="radio" name="pgk_p3" value="salah" class="w-4 h-4 cursor-pointer" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`
                          )
                        }
                        className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-400 px-2 py-0.5 rounded transition-colors"
                      >
                        + Sisipkan Template Tabel 3 Pernyataan ke Media Soal
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-700 leading-relaxed">
                      Standar resmi AKM Asesmen Nasional. Siswa membaca stimulus lalu menentukan kategori (Benar/Salah atau Sesuai/Tidak Sesuai) untuk <strong>tepat 3 butir pernyataan</strong> menggunakan radio button per baris tabel.
                    </p>
                  </div>
                )}
              </div>
            )}

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
                  Kolom HTML Gambar / Video Soal Kuis (Stimulus Soal, opsional)
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
                        '<div class="aspect-video w-full max-w-md mx-auto my-2 rounded overflow-hidden border border-stone-900"><iframe class="w-full h-full" src="https://www.youtube.com/embed/GANTI-ID-VIDEO" title="Video Kasus Soal" allowfullscreen></iframe></div>'
                      )
                    }
                    className="text-[10px] font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-900 px-2 py-0.5 rounded"
                  >
                    + Contoh Video Soal
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChange(
                        'htmlMediaSoal',
                        '<div class="p-2.5 border-2 border-stone-900 bg-amber-50 rounded text-xs space-y-2"><p class="font-bold text-stone-900">Perhatikan tabel 3 pernyataan di bawah ini, lalu tentukan kategori Benar atau Salah:</p><table class="w-full text-xs border-collapse border border-stone-800 bg-white"><tr class="bg-amber-200 border-b border-stone-800"><th class="p-1.5 border-r border-stone-800">No</th><th class="p-1.5 border-r border-stone-800 text-left">Pernyataan</th><th class="p-1.5 border-r border-stone-800">Benar</th><th class="p-1.5">Salah</th></tr><tr class="border-b border-stone-300"><td class="p-1.5 border-r border-stone-800 text-center font-bold">1</td><td class="p-1.5 border-r border-stone-800">Pernyataan stimulus ke-1...</td><td class="p-1.5 border-r border-stone-800 text-center"><input type="radio" name="p1" /></td><td class="p-1.5 text-center"><input type="radio" name="p1" /></td></tr><tr class="border-b border-stone-300"><td class="p-1.5 border-r border-stone-800 text-center font-bold">2</td><td class="p-1.5 border-r border-stone-800">Pernyataan stimulus ke-2...</td><td class="p-1.5 border-r border-stone-800 text-center"><input type="radio" name="p2" /></td><td class="p-1.5 text-center"><input type="radio" name="p2" /></td></tr><tr><td class="p-1.5 border-r border-stone-800 text-center font-bold">3</td><td class="p-1.5 border-r border-stone-800">Pernyataan stimulus ke-3...</td><td class="p-1.5 border-r border-stone-800 text-center"><input type="radio" name="p3" /></td><td class="p-1.5 text-center"><input type="radio" name="p3" /></td></tr></table></div>'
                      )
                    }
                    className="text-[10px] font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-900 px-2 py-0.5 rounded"
                  >
                    + Tabel 3 Pernyataan (PGK)
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

              <AiMediaPanel
                title="Soal Kuis"
                keywordPlaceholder="Kata kunci / preferensi (opsional), mis. contoh email phishing, infografis, kanal edukasi berbahasa Indonesia"
                value={data.aiMedia.soal}
                onChange={(next) => onChange('aiMedia', { ...data.aiMedia, soal: next })}
              />

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
            <div className="pt-2 border-t border-stone-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-bold uppercase text-stone-800">
                  Fitur Keamanan, Pembatasan Siswa & Pemantauan Integritas
                </span>
                <span className="text-[10px] font-mono bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded font-bold">
                  Satu Kali Kirim + Mode Latihan + Log Integritas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  {
                    key: 'singleSubmission' as const,
                    label: '1. Satu Kali Kirim (LockService 20s)',
                    desc: 'Kunci nama+kelas, localStorage & LockService 20s server',
                    highlight: true,
                  },
                  {
                    key: 'modeLatihanSetelahKirim' as const,
                    label: '2. Mode Latihan Pasca Kirim',
                    desc: 'Reset jawaban, feedback hijau/merah, tombol ulangi & ganti siswa',
                    highlight: true,
                  },
                  {
                    key: 'pantauWaktuBelajar' as const,
                    label: '3. Pemantauan Waktu Aktif',
                    desc: 'Waktu total & 8 langkah, tab aktif (skip delta > 3s)',
                    highlight: true,
                  },
                  {
                    key: 'pantauKeluarTab' as const,
                    label: '4. Pelacak Keluar Tab',
                    desc: 'Frekuensi, total durasi, log maks 40 entri & alert kembali',
                    highlight: true,
                  },
                  {
                    key: 'pantauLayarPenuh' as const,
                    label: '5. Layar Penuh & Cadangan iPhone',
                    desc: 'Tombol fullscreen, hitung keluar & overlay iOS Safari',
                    highlight: true,
                  },
                  {
                    key: 'hitungNilaiLangsung' as const,
                    label: 'Hitung Nilai Langsung',
                    desc: 'Otomatis kalkulasi skor akhir',
                    highlight: false,
                  },
                  {
                    key: 'timerDurasi' as const,
                    label: 'Timer Pengerjaan',
                    desc: `${data.quizSettings.timerMenit} Menit hitung mundur`,
                    highlight: false,
                  },
                  {
                    key: 'antiKopas' as const,
                    label: 'Tidak Bisa Kopas',
                    desc: 'Disable copy, cut, paste & select',
                    highlight: false,
                  },
                  {
                    key: 'antiTranslate' as const,
                    label: 'Tidak Bisa Translate',
                    desc: 'Cegah translate otomatis browser',
                    highlight: false,
                  },
                  {
                    key: 'antiScreenshot' as const,
                    label: 'Tidak Bisa Screenshot',
                    desc: 'Watermark & blur proteksi layar',
                    highlight: false,
                  },
                ].map((sec) => {
                  const val = data.quizSettings[sec.key];
                  return (
                    <button
                      key={sec.key}
                      type="button"
                      onClick={() => updateQuiz(sec.key, !val)}
                      className={`p-2.5 text-left border-2 border-stone-900 rounded transition-all flex items-start gap-2 ${
                        val
                          ? sec.highlight
                            ? 'bg-[#DCFCE7] text-stone-900 font-bold neo-shadow-sm border-emerald-950'
                            : 'bg-[#FEF08A] text-stone-900 font-bold neo-shadow-sm'
                          : 'bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border border-stone-900 flex items-center justify-center shrink-0 mt-0.5 ${
                          val ? 'bg-stone-900 text-white' : 'bg-white'
                        }`}
                      >
                        {val && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      </div>
                      <div>
                        <div className="text-xs leading-snug">{sec.label}</div>
                        <div className="text-[10px] text-stone-500 font-normal mt-0.5">{sec.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Timer input if timer is active */}
              {data.quizSettings.timerDurasi && (
                <div className="flex items-center gap-2 p-2 bg-[#FEF9C3] border border-amber-300 rounded">
                  <Clock className="w-4 h-4 text-amber-800" />
                  <span className="text-xs font-bold text-stone-800">Durasi Timer Kuis:</span>
                  <input
                    type="number"
                    min={3}
                    max={120}
                    value={data.quizSettings.timerMenit}
                    onChange={(e) => updateQuiz('timerMenit', parseInt(e.target.value) || 15)}
                    className="w-16 px-2 py-1 text-xs border-2 border-stone-900 rounded bg-white text-center font-bold"
                  />
                  <span className="text-xs text-stone-700 font-medium">menit hitung mundur (otomatis kumpul saat habis)</span>
                </div>
              )}

              {/* Detail Panduan Fitur Keamanan & Pembatasan Siswa */}
              <div className="p-3 bg-[#FAF7F2] border-2 border-stone-900 rounded-md text-xs space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-stone-900">
                  <ShieldAlert className="w-4 h-4 text-purple-700" />
                  <span>Spesifikasi Teknis Fitur Keamanan, Mode Latihan & Pemantauan (Sesuai Aturan Prompt):</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] leading-relaxed">
                  {/* Card 1: Satu Kali Kirim */}
                  <div className="bg-white p-2.5 rounded border border-stone-300 space-y-1.5">
                    <span className="font-bold text-purple-900 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-purple-700" />
                      1. Satu Kali Kirim
                    </span>
                    <ul className="list-disc list-inside text-stone-700 space-y-1">
                      <li><strong>Kunci unik:</strong> <code>nama + kelas</code> huruf kecil dengan spasi dirapikan (<code>trim().toLowerCase().replace(/\s+/g, ' ')</code>).</li>
                      <li>Disimpan di <code>localStorage</code> dan diverifikasi di server Apps Script pada kolom <code>Kunci</code> menggunakan <code>LockService 20 detik</code>.</li>
                      <li>Jika duplikat, server mengembalikan <code>{`{ ok: false, dup: true }`}</code> dan widget slide otomatis beralih ke Mode Latihan.</li>
                      <li>Tombol kirim terkunci (disabled) selama proses kirim untuk mencegah klik ganda.</li>
                    </ul>
                  </div>

                  {/* Card 2: Mode Latihan */}
                  <div className="bg-white p-2.5 rounded border border-stone-300 space-y-1.5">
                    <span className="font-bold text-emerald-900 flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                      2. Mode Latihan
                    </span>
                    <ul className="list-disc list-inside text-stone-700 space-y-1">
                      <li>Jawaban & refleksi dikosongkan/reset; laporan nilai resmi tidak dikirim ulang ke server spreadsheet.</li>
                      <li>Pencatat waktu dan pelacak keluar tab dihentikan.</li>
                      <li>Umpan balik instan: jawaban langsung ditandai <span className="text-emerald-700 font-bold">hijau (benar)</span> atau <span className="text-rose-700 font-bold">merah (salah)</span> beserta pembahasan ringkas.</li>
                      <li>Tersedia tombol <strong>"ULANGI LATIHAN"</strong> untuk mencoba kembali secara mandiri.</li>
                      <li>Tersedia tombol <strong>"Mulai sebagai siswa baru"</strong> (dengan dialog konfirmasi) untuk perangkat HP/Lab yang dipakai bergantian antar siswa.</li>
                    </ul>
                  </div>

                  {/* Card 3: Pemantauan */}
                  <div className="bg-white p-2.5 rounded border border-stone-300 space-y-1.5">
                    <span className="font-bold text-blue-900 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-blue-700" />
                      3. Pemantauan Integritas
                    </span>
                    <ul className="list-disc list-inside text-stone-700 space-y-1">
                      <li><strong>Waktu belajar:</strong> Waktu total dan per langkah (8 langkah), hanya dihitung saat tab aktif/terlihat (<code>document.hidden === false</code>); lonjakan selisih &gt; 3 detik diabaikan.</li>
                      <li><strong>Keluar tab:</strong> Deteksi <code>visibilitychange</code>, catat frekuensi keluar, total durasi (detik), dan log detail maks 40 entri (<code>jam, langkah, detik</code>). Siswa diberi peringatan saat kembali ke tab.</li>
                      <li><strong>Layar penuh:</strong> Tombol fullscreen, catat berapa kali keluar layar penuh, serta cadangan overlay fixed untuk iPhone / iOS Safari.</li>
                    </ul>
                  </div>
                </div>
              </div>
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
