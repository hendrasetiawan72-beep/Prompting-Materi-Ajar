import { PromptFormData, PresetTemplate } from '../types';

export const DEFAULT_ALUR_LIST = [
  { id: '1', label: 'Pembuka + pertanyaan pemantik', enabled: true },
  { id: '2', label: 'Tujuan & alur belajar', enabled: true },
  { id: '3', label: 'Apersepsi', enabled: true },
  { id: '4', label: 'Input materi (konsep, contoh, istilah)', enabled: true },
  { id: '5', label: 'Latihan bertahap (scaffolding)', enabled: true },
  { id: '6', label: 'Aktivitas inti', enabled: true },
  { id: '7', label: 'Produk/proyek', enabled: false },
  { id: '8', label: 'Asesmen', enabled: true },
  { id: '9', label: 'Refleksi & tindak lanjut', enabled: true },
  { id: '10', label: 'Slide penutup/tautan lanjutan', enabled: true, customNote: '' },
];

export const AKTIVITAS_KATEGORI = [
  {
    kategori: 'Pemantik',
    color: 'bg-amber-100',
    borderColor: 'border-amber-400',
    items: [
      { id: 'studi kasus singkat', label: 'Studi kasus singkat' },
      { id: 'polling', label: 'Polling cepat' },
      { id: 'skenario', label: 'Skenario problematis' },
      { id: 'video/gambar pemicu', label: 'Video / gambar pemicu' },
    ],
  },
  {
    kategori: 'Eksplorasi',
    color: 'bg-emerald-100',
    borderColor: 'border-emerald-400',
    items: [
      { id: 'think-pair-share', label: 'Think-Pair-Share' },
      { id: 'jigsaw', label: 'Jigsaw' },
      { id: 'diskusi kelompok', label: 'Diskusi kelompok' },
      { id: 'investigasi data/sumber', label: 'Investigasi data/sumber' },
      { id: 'observasi bengkel/lab', label: 'Observasi bengkel / lab' },
    ],
  },
  {
    kategori: 'Praktik',
    color: 'bg-sky-100',
    borderColor: 'border-sky-400',
    items: [
      { id: 'demonstrasi + latihan terbimbing', label: 'Demonstrasi + latihan terbimbing' },
      { id: 'simulasi/role play', label: 'Simulasi / Role play' },
      { id: 'latihan soal bertahap', label: 'Latihan soal bertahap' },
    ],
  },
  {
    kategori: 'Produksi',
    color: 'bg-purple-100',
    borderColor: 'border-purple-400',
    items: [
      { id: 'proyek/produk', label: 'Proyek / Produk nyata' },
      { id: 'presentasi/debat', label: 'Presentasi / Debat' },
      { id: 'poster/infografis', label: 'Poster / Infografis' },
      { id: 'podcast/video', label: 'Podcast / Video pendek' },
      { id: 'gallery walk', label: 'Gallery walk' },
    ],
  },
  {
    kategori: 'Asesmen',
    color: 'bg-rose-100',
    borderColor: 'border-rose-400',
    items: [
      { id: 'kuis interaktif', label: 'Kuis interaktif' },
      { id: 'exit ticket', label: 'Exit ticket (tiket keluar)' },
      { id: 'rubrik', label: 'Rubrik asesmen diri' },
      { id: 'peer feedback (2 stars 1 wish)', label: 'Peer feedback (2 stars 1 wish)' },
    ],
  },
  {
    kategori: 'Refleksi',
    color: 'bg-orange-100',
    borderColor: 'border-orange-400',
    items: [
      { id: 'jurnal', label: 'Jurnal refleksi' },
      { id: 'KWL', label: 'Bagan KWL (Know-Want-Learned)' },
      { id: '3-2-1', label: 'Teknik 3-2-1' },
    ],
  },
  {
    kategori: 'Opsional',
    color: 'bg-lime-100',
    borderColor: 'border-lime-400',
    items: [
      { id: 'gamifikasi/misi', label: 'Gamifikasi / Misi petualangan' },
      { id: 'game eksternal', label: 'Game eksternal (Wordwall/Quizizz URL)' },
    ],
  },
];

export const INITIAL_FORM_DATA: PromptFormData = {
  // 1. IDENTITAS
  mataPelajaran: 'Informatika',
  topikMateri: 'Keamanan Siber: Mengidentifikasi & Mencegah Serangan Phishing',
  jenjangKelasFase: 'SMK Kelas X, Fase E',
  sekolahJurusanKelompok: 'SMK Negeri 1 (Teknologi Informasi & Jaringan)',
  durasi: '2 pertemuan × 45 menit (90 menit)',
  bahasaSlide: 'Indonesia',
  bahasaInstruksiSiswa: 'Indonesia santai, komunikatif, dan terarah',

  // 2. TUJUAN
  cpTpAtp: 'Peserta didik mampu memahami konsep ancaman siber, mengenali ciri-ciri phishing pada email/pesan instan, dan mempraktikkan langkah verifikasi URL secara aman.',
  indikatorBerhasil: '1) Menyebutkan 3 ciri utama pesan phishing; 2) Menemukan tautan mencurigakan pada studi kasus simulasi; 3) Merancang prosedur proteksi akun.',
  pengetahuanAwalSiswa: 'Siswa sudah terbiasa menggunakan email, browser, dan media sosial di smartphone masing-masing.',
  pendekatan: 'Problem-Based Learning (PBL) dipadukan dengan Deep Learning (mindful, meaningful, joyful)',

  // 3. KONDISI KELAS
  perangkat: ['HP Siswa', 'Laptop Guru', 'Proyektor'],
  internet: 'stabil',
  karakterSiswaKendala: 'Siswa sangat aktif bermain gadget namun cenderung impulsif mengklik link promo atau undian di WhatsApp.',
  konteksDekatSiswa: 'Kasus nyata pembobolan rekening atau akun game online akibat link phishing yang marak di kalangan remaja.',

  // 4. ALUR
  alurList: DEFAULT_ALUR_LIST,

  // 5. MENU AKTIVITAS
  aktivitasTerpilih: ['studi kasus singkat', 'think-pair-share', 'simulasi/role play', 'kuis interaktif', '3-2-1'],
  gameExternalUrl: '',

  // 6. ASESMEN
  jenisAsesmen: 'formatif',
  skemaSkor: 'total 100, bobot per soal, pengurangan jika salah',
  hasilAsesmen: 'dikirim ke guru lewat formulir',
  quizSettings: {
    web3formKey: '',
    namaGuru: 'Pak Budi Santoso, S.Kom.',
    bentukSoal: 'pilihan ganda',
    hitungNilaiLangsung: true,
    timerDurasi: true,
    timerMenit: 15,
    antiKopas: true,
    antiTranslate: true,
    antiScreenshot: true,
    singleSubmission: true,
  },

  // 7. FORMAT KELUARAN
  formatKeluaran: 'C',
  modeKerja: 'langsung jadi',
  jumlahSlide: '10 slide interaktif',

  // 8. GAYA VISUAL & LAMPIRAN MEDIA SEKOLAH
  temaVisual: 'Vintage Postmodernism Neobrutalist Colorful Pastel Elegant, aksen kartu retro modern',
  paletFont: 'Pastel lembut (vanilla custard, sage mint, peach, lavender) & font Space Grotesk / Plus Jakarta Sans',
  logoGambar: 'placeholder logo sekolah & ilustrasi keamanan siber',
  htmlLogoSekolah: '<img src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120&auto=format&fit=crop&q=80" alt="Logo Sekolah" class="h-10 w-auto rounded border border-stone-800" />',
  htmlBackgroundSekolah: '<div class="absolute inset-0 opacity-10 bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>',
  emojiIkon: 'ya',

  // LAMPIRAN MEDIA HTML MATERI & SOAL
  htmlMediaMateri: '<div class="p-3 bg-white border-2 border-stone-800 rounded-md shadow-[2px_2px_0px_#1c1917]"><img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80" alt="Ilustrasi Phishing Cyber Security" class="w-full h-44 object-cover rounded mb-2" /><p class="text-xs text-stone-600 italic">Gambar 1. Anatomi pesan phishing yang menyamar sebagai layanan resmi.</p></div>',
  htmlMediaSoal: '<div class="p-2 border border-rose-300 bg-rose-50 rounded text-center"><img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80" alt="Kasus Soal Analisis URL Palsu" class="mx-auto h-36 object-cover rounded mb-1" /><span class="text-[11px] font-mono text-stone-700">Perhatikan tangkapan layar domain di atas untuk menjawab soal nomor 1-3.</span></div>',

  // 9. CATATAN KHUSUS
  catatanKhusus: 'Gunakan studi kasus pesan WhatsApp phishing nyata, hindari penjelasan teknis kriptografi yang terlalu rumit, fokus pada critical thinking siswa.',
};

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'smk-informatika',
    nama: 'Informatika SMK: Keamanan Siber',
    tag: 'SMK Fase E · IT',
    deskripsi: 'Simulasi deteksi phishing interaktif dengan kuis anti-curang & Web3Forms.',
    data: INITIAL_FORM_DATA,
  },
  {
    id: 'smp-bahasa-indonesia',
    nama: 'Bahasa Indonesia SMP: Teks LHO',
    tag: 'SMP Fase D · Literasi',
    deskripsi: 'Mengamati lingkungan sekolah untuk menulis Teks Laporan Hasil Observasi bertahap.',
    data: {
      mataPelajaran: 'Bahasa Indonesia',
      topikMateri: 'Menulis Teks Laporan Hasil Observasi (LHO) Berbasis Lingkungan Sekolah',
      jenjangKelasFase: 'SMP Kelas VIII, Fase D',
      sekolahJurusanKelompok: 'SMP Negeri Terbuka',
      durasi: '2 pertemuan × 40 menit (80 menit)',
      bahasaSlide: 'Indonesia',
      bahasaInstruksiSiswa: 'Bahasa Indonesia komunikatif, membimbing, dan ramah anak',
      cpTpAtp: 'Peserta didik mampu menganalisis struktur dan kaidah kebahasaan teks LHO serta menyajikan hasil pengamatan secara objektif.',
      indikatorBerhasil: '1) Membedakan fakta dan opini; 2) Mengidentifikasi struktur teks LHO (pernyataan umum, deskripsi bagian, deskripsi manfaat); 3) Menyusun draf teks LHO 3 paragraf.',
      pengetahuanAwalSiswa: 'Siswa sudah memahami teks deskripsi sederhana pada jenjang sebelumnya.',
      pendekatan: 'Inkuiri Terbimbing & Contextual Teaching and Learning (CTL)',
      perangkat: ['HP Siswa', 'Proyektor'],
      internet: 'terbatas',
      karakterSiswaKendala: 'Gemar belajar di luar ruang kelas, cepat bosan dengan materi definisi teoritis yang panjang.',
      konteksDekatSiswa: 'Taman sekolah, kantin sehat, dan tempat pemilahan sampah sekolah.',
      aktivitasTerpilih: ['video/gambar pemicu', 'observasi bengkel/lab', 'diskusi kelompok', 'poster/infografis', 'exit ticket'],
      jenisAsesmen: 'formatif',
      skemaSkor: 'total 100, bobot per soal',
      hasilAsesmen: 'lokal saja',
      formatKeluaran: 'B',
      modeKerja: 'langsung jadi',
      jumlahSlide: '8 slide',
      temaVisual: 'Warm Botanical Vintage, warna sage mint dan earth tone pastel, minimalis elegan',
      paletFont: 'Earthy cream, pistachio, terracotta soft dengan font serif retro elegan',
      emojiIkon: 'ya',
      catatanKhusus: 'Pastikan ada panduan lembar observasi singkat yang bisa dikerjakan di taman sekolah.',
    },
  },
  {
    id: 'sd-ipas',
    nama: 'IPAS SD: Rantai Makanan & Ekosistem',
    tag: 'SD Fase C · Sains',
    deskripsi: 'Petualangan visual jaring-jaring makanan di sawah dengan gamifikasi menyenangkan.',
    data: {
      mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
      topikMateri: 'Rantai Makanan & Keseimbangan Ekosistem Sawah',
      jenjangKelasFase: 'SD Kelas V, Fase C',
      sekolahJurusanKelompok: 'SD Ceria Merdeka',
      durasi: '2 JP (2 × 35 menit = 70 menit)',
      bahasaSlide: 'Indonesia',
      bahasaInstruksiSiswa: 'Bahasa Indonesia ceria, mudah dipahami, penuh semangat',
      cpTpAtp: 'Peserta didik dapat mengidentifikasi peran produsen, konsumen, dan dekomposer dalam rantai makanan serta memprediksi dampak kepunahan salah satu komponen.',
      indikatorBerhasil: '1) Menyusun urutan rantai makanan sawah; 2) Menganalisis akibat jika populasi ular menurun terhadap hama tikus.',
      pengetahuanAwalSiswa: 'Siswa sudah mengenal herbivora, karnivora, dan omnivora.',
      pendekatan: 'Deep Learning (Mindful, Meaningful, Joyful) berbasis visual',
      perangkat: ['Proyektor', 'Laptop Guru'],
      internet: 'stabil',
      karakterSiswaKendala: 'Sangat responsif terhadap gambar warna-warni dan kuis tebak-tebakan, rentan terdistraksi jika teks terlalu padat.',
      konteksDekatSiswa: 'Area persawahan di sekitar lingkungan pedesaan tempat tinggal siswa.',
      aktivitasTerpilih: ['skenario', 'think-pair-share', 'simulasi/role play', 'kuis interaktif', 'KWL', 'gamifikasi/misi'],
      jenisAsesmen: 'formatif',
      skemaSkor: 'total 100, bobot per soal',
      hasilAsesmen: 'tidak dikirim',
      formatKeluaran: 'C',
      modeKerja: 'langsung jadi',
      jumlahSlide: '8 slide interaktif',
      temaVisual: 'Colorful Pastel Playful Neobrutalist dengan ilustrasi hewan lucu dan kartu tebal',
      paletFont: 'Lemon yellow, mint green, sky blue, candy pink dengan font rounded bold',
      emojiIkon: 'ya',
      catatanKhusus: 'Gunakan analogi cerita detektif alam untuk menjaga antusiasme siswa SD.',
    },
  },
  {
    id: 'sma-matematika',
    nama: 'Matematika SMA: Peluang Kejadian',
    tag: 'SMA Fase F · STEM',
    deskripsi: 'Peluang majemuk dan pengambilan keputusan logis dalam bisnis & investasi.',
    data: {
      mataPelajaran: 'Matematika Tingkat Lanjut',
      topikMateri: 'Peluang Kejadian Majemuk & Analisis Risiko Keputusan',
      jenjangKelasFase: 'SMA Kelas XI, Fase F',
      sekolahJurusanKelompok: 'SMA Unggulan',
      durasi: '2 pertemuan × 45 menit',
      bahasaSlide: 'Indonesia',
      bahasaInstruksiSiswa: 'Indonesia terstruktur, logis, dan analitis',
      cpTpAtp: 'Peserta didik mampu merumuskan peluang saling lepas dan saling bebas serta menerapkannya dalam estimasi risiko.',
      indikatorBerhasil: '1) Menghitung peluang kejadian saling lepas; 2) Menentukan peluang bersyarat; 3) Menginterpretasikan grafik probabilitas.',
      pengetahuanAwalSiswa: 'Siswa telah menguasai aturan pencacahan (permutasi dan kombinasi).',
      pendekatan: 'Problem-Based Learning (PBL) dan Scaffolding Terbimbing',
      perangkat: ['Laptop', 'HP Siswa', 'Proyektor'],
      internet: 'stabil',
      karakterSiswaKendala: 'Kerap menganggap rumus matematika abstrak dan tidak relevan dengan kehidupan masa depan.',
      konteksDekatSiswa: 'Keputusan membuka stand usaha di festival sekolah atau peluang lolos seleksi perguruan tinggi.',
      aktivitasTerpilih: ['studi kasus singkat', 'investigasi data/sumber', 'latihan soal bertahap', 'kuis interaktif', '3-2-1'],
      jenisAsesmen: 'sumatif',
      skemaSkor: 'total 100, bobot per soal, pengurangan jika salah',
      hasilAsesmen: 'dikirim ke guru lewat formulir',
      formatKeluaran: 'C',
      modeKerja: 'langsung jadi',
      jumlahSlide: '12 slide interaktif',
      temaVisual: 'Modern Vintage Minimalist, grid teknis bersih dengan aksen pastel lavender & navy',
      paletFont: 'Monospace angka tabular + Serif retro elegant untuk judul',
      emojiIkon: 'tidak',
      catatanKhusus: 'Tampilkan diagram pohon dan tabel probabilitas yang interaktif dapat diklik.',
    },
  },
];
