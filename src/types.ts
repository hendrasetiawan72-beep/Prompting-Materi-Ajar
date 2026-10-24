export type OutputFormatType = 'A' | 'B' | 'C' | 'D';

export type WorkModeType = 'rancangan dulu, tunggu persetujuan' | 'langsung jadi';

export type InternetCondition = 'stabil' | 'terbatas' | 'offline';

export type AssessmentType = 'diagnostik' | 'formatif' | 'sumatif';

export type SubmissionType = 'tidak dikirim' | 'dikirim ke guru lewat formulir' | 'lokal saja';

export interface AlurItem {
  id: string;
  label: string;
  enabled: boolean;
  customNote?: string;
}

// Bentuk soal kuis. Boleh dipilih lebih dari satu (disimpan sebagai array).
export type BentukSoalType =
  | 'pilihan ganda'
  | 'mcma'
  | 'pg_kompleks_kategori_3'
  | 'essay';

// Pengaturan permintaan pencarian media (gambar & video YouTube) oleh AI untuk satu target
export interface AiMediaTarget {
  gambar: boolean;
  video: boolean;
  maksGambar: number;
  maksVideo: number;
  kataKunci: string;
}

export interface AiMediaSettings {
  materi: AiMediaTarget;
  soal: AiMediaTarget;
}

export interface QuizSettings {
  web3formKey: string;
  submissionTarget: 'web3forms' | 'appscript' | 'both';
  appScriptUrl: string;
  sheetName: string;
  namaGuru: string;
  bentukSoal: BentukSoalType[];
  hitungNilaiLangsung: boolean;
  timerDurasi: boolean;
  timerMenit: number;
  antiKopas: boolean;
  antiTranslate: boolean;
  antiScreenshot: boolean;
  singleSubmission: boolean;
  modeLatihanSetelahKirim: boolean;
  pantauWaktuBelajar: boolean;
  pantauKeluarTab: boolean;
  pantauLayarPenuh: boolean;
}

export interface PromptFormData {
  // 1. IDENTITAS
  mataPelajaran: string;
  topikMateri: string;
  jenjangKelasFase: string;
  sekolahJurusanKelompok: string;
  durasi: string;
  bahasaSlide: string;
  bahasaInstruksiSiswa: string;

  // 2. TUJUAN
  cpTpAtp: string;
  indikatorBerhasil: string;
  pengetahuanAwalSiswa: string;
  pendekatan: string;

  // 3. KONDISI KELAS
  perangkat: string[];
  internet: InternetCondition;
  karakterSiswaKendala: string;
  konteksDekatSiswa: string;

  // 4. ALUR
  alurList: AlurItem[];

  // 5. MENU AKTIVITAS
  aktivitasTerpilih: string[];
  gameExternalUrl: string;

  // 6. ASESMEN
  jenisAsesmen: AssessmentType;
  skemaSkor: string;
  hasilAsesmen: SubmissionType;
  quizSettings: QuizSettings;

  // 7. FORMAT KELUARAN
  formatKeluaran: OutputFormatType;
  modeKerja: WorkModeType;
  jumlahSlide: string;

  // 8. GAYA VISUAL & LAMPIRAN MEDIA SEKOLAH
  temaVisual: string;
  paletFont: string;
  efekSlide: string;
  logoGambar: string;
  htmlLogoSekolah: string;
  htmlBackgroundSekolah: string;
  emojiIkon: 'ya' | 'tidak';

  // LAMPIRAN MEDIA HTML MATERI & SOAL
  htmlMediaMateri: string;
  htmlMediaSoal: string;

  // PENCARIAN MEDIA OLEH AI (gambar & embed YouTube dari internet)
  aiMedia: AiMediaSettings;

  // 9. CATATAN KHUSUS
  catatanKhusus: string;
}

export interface PresetTemplate {
  id: string;
  nama: string;
  tag: string;
  deskripsi: string;
  data: Partial<PromptFormData>;
}
