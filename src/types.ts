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

export interface QuizSettings {
  web3formKey: string;
  namaGuru: string;
  bentukSoal: 'pilihan ganda' | 'essay' | 'campuran pilihan ganda & essay';
  hitungNilaiLangsung: boolean;
  timerDurasi: boolean;
  timerMenit: number;
  antiKopas: boolean;
  antiTranslate: boolean;
  antiScreenshot: boolean;
  singleSubmission: boolean;
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
  logoGambar: string;
  htmlLogoSekolah: string;
  htmlBackgroundSekolah: string;
  emojiIkon: 'ya' | 'tidak';

  // LAMPIRAN MEDIA HTML MATERI & SOAL
  htmlMediaMateri: string;
  htmlMediaSoal: string;

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
