import { PromptFormData } from '../types';

export interface GeneratorOptions {
  includeSectionsBCD?: boolean;
  cleanUnusedLines?: boolean;
  activeFormatOnly?: boolean;
}

export function generatePromptInduk(
  data: PromptFormData,
  options: GeneratorOptions = { includeSectionsBCD: true, cleanUnusedLines: false }
): string {
  const { includeSectionsBCD = true, cleanUnusedLines = false } = options;

  const lines: string[] = [];

  // Header & Peran
  lines.push('PROMPT INDUK: GENERATOR SLIDE MATERI AJAR');
  lines.push('(Edit Bagian A saja. Hapus baris yang tidak dipakai.)');
  lines.push('');
  lines.push('*PERAN*');
  lines.push(
    'Kamu adalah desainer pembelajaran dan pengembang materi ajar berpengalaman sekaligus developer front-end. Buat slide materi ajar berdasarkan Bagian A, ikuti aturan Bagian B–D.'
  );
  lines.push('');
  lines.push('══ BAGIAN A. ISIAN (EDIT DI SINI) ══');
  lines.push('');

  // 1. IDENTITAS
  lines.push('*1. IDENTITAS*');
  lines.push(`- Mata pelajaran: ${data.mataPelajaran || (cleanUnusedLines ? '' : '[ISI]')}`);
  lines.push(`- Topik/materi: ${data.topikMateri || (cleanUnusedLines ? '' : '[ISI]')}`);
  lines.push(`- Jenjang, kelas, fase: ${data.jenjangKelasFase || (cleanUnusedLines ? '' : '[ISI]')}`);
  if (!cleanUnusedLines || data.sekolahJurusanKelompok) {
    lines.push(`- Sekolah/jurusan/kelompok: ${data.sekolahJurusanKelompok || '[ISI atau hapus]'}`);
  }
  lines.push(`- Durasi: ${data.durasi || (cleanUnusedLines ? '' : '[mis. 2 pertemuan × 90 menit]')}`);
  lines.push(`- Bahasa slide: ${data.bahasaSlide || (cleanUnusedLines ? '' : '[Indonesia / Inggris / campuran]')}`);
  lines.push(`- Bahasa instruksi siswa: ${data.bahasaInstruksiSiswa || (cleanUnusedLines ? '' : '[ISI]')}`);
  lines.push('');

  // 2. TUJUAN
  lines.push('*2. TUJUAN*');
  lines.push(`- CP/TP/ATP: ${data.cpTpAtp || (cleanUnusedLines ? '' : '[tempel, atau tulis "buatkan yang selaras Kurikulum Merdeka"]')}`);
  lines.push(`- Indikator berhasil: ${data.indikatorBerhasil || (cleanUnusedLines ? '' : '[ISI atau "buatkan"]')}`);
  lines.push(`- Pengetahuan awal siswa: ${data.pengetahuanAwalSiswa || (cleanUnusedLines ? '' : '[ISI]')}`);
  lines.push(`- Pendekatan: ${data.pendekatan || (cleanUnusedLines ? '' : '[mis. deep learning (mindful, meaningful, joyful), PBL, PjBL, inkuiri]')}`);
  lines.push('');

  // 3. KONDISI KELAS
  lines.push('*3. KONDISI KELAS*');
  const perangkatStr = data.perangkat.length > 0 ? data.perangkat.join(' / ') : (cleanUnusedLines ? '' : '[HP / laptop / proyektor]');
  lines.push(`- Perangkat: ${perangkatStr}`);
  lines.push(`- Internet: ${data.internet || (cleanUnusedLines ? '' : '[stabil / terbatas / offline]')}`);
  lines.push(`- Karakter siswa & kendala: ${data.karakterSiswaKendala || (cleanUnusedLines ? '' : '[ISI]')}`);
  lines.push(`- Konteks yang dekat dengan siswa: ${data.konteksDekatSiswa || (cleanUnusedLines ? '' : '[mis. dunia kerja jurusan, lingkungan sekolah]')}`);
  lines.push('');

  // 4. ALUR (urutkan, hapus yang tidak perlu)
  lines.push('*4. ALUR (urutkan, hapus yang tidak perlu)*');
  data.alurList.forEach((item) => {
    if (cleanUnusedLines && !item.enabled) {
      return; // Omit unchecked items if cleaning unused lines
    }
    const checkMark = item.enabled ? '[x]' : '[ ]';
    if (item.label.includes('Slide penutup')) {
      const urlText = item.customNote ? item.customNote : (cleanUnusedLines ? '' : '[URL atau hapus]');
      lines.push(`${checkMark} Slide penutup/tautan lanjutan: ${urlText}`);
    } else {
      lines.push(`${checkMark} ${item.label}`);
    }
  });
  lines.push('');

  // 5. MENU AKTIVITAS (centang 3–6)
  lines.push('*5. MENU AKTIVITAS (centang 3–6)*');
  const act = data.aktivitasTerpilih;
  const isC = (id: string) => (act.includes(id) ? '[x]' : '[ ]');

  if (!cleanUnusedLines) {
    lines.push(
      `Pemantik: ${isC('studi kasus singkat')} studi kasus singkat ${isC('polling')} polling ${isC('skenario')} skenario ${isC('video/gambar pemicu')} video/gambar pemicu`
    );
    lines.push(
      `Eksplorasi: ${isC('think-pair-share')} think-pair-share ${isC('jigsaw')} jigsaw ${isC('diskusi kelompok')} diskusi kelompok ${isC('investigasi data/sumber')} investigasi data/sumber ${isC('observasi bengkel/lab')} observasi bengkel/lab`
    );
    lines.push(
      `Praktik: ${isC('demonstrasi + latihan terbimbing')} demonstrasi + latihan terbimbing ${isC('simulasi/role play')} simulasi/role play ${isC('latihan soal bertahap')} latihan soal bertahap`
    );
    lines.push(
      `Produksi: ${isC('proyek/produk')} proyek/produk ${isC('presentasi/debat')} presentasi/debat ${isC('poster/infografis')} poster/infografis ${isC('podcast/video')} podcast/video ${isC('gallery walk')} gallery walk`
    );
    lines.push(
      `Asesmen: ${isC('kuis interaktif')} kuis interaktif ${isC('exit ticket')} exit ticket ${isC('rubrik')} rubrik ${isC('peer feedback (2 stars 1 wish)')} peer feedback (2 stars 1 wish)`
    );
    lines.push(`Refleksi: ${isC('jurnal')} jurnal ${isC('KWL')} KWL ${isC('3-2-1')} 3-2-1`);
    lines.push(
      `Opsional: ${isC('gamifikasi/misi')} gamifikasi/misi ${isC('game eksternal')} game eksternal (URL: ${data.gameExternalUrl || '[ISI]'})`
    );
  } else {
    // When cleaned, show list of checked activities organized clearly
    const checkedSummary: string[] = [];
    if (act.length === 0) {
      checkedSummary.push('- Belum ada aktivitas yang dicentang (pilih 3-6)');
    } else {
      act.forEach((item) => {
        if (item === 'game eksternal') {
          checkedSummary.push(`- [x] ${item} (URL: ${data.gameExternalUrl || 'tanpa URL'})`);
        } else {
          checkedSummary.push(`- [x] ${item}`);
        }
      });
    }
    lines.push(...checkedSummary);
  }
  lines.push('');

  // 6. ASESMEN
  lines.push('*6. ASESMEN*');
  lines.push(`Jenis: [${data.jenisAsesmen || 'formatif'}]`);
  lines.push(`Skema skor: [${data.skemaSkor || 'total 100, bobot per soal'}]`);
  lines.push(`Hasil: [${data.hasilAsesmen || 'tidak dikirim'}]`);

  const q = data.quizSettings;
  const web3KeyText = q.web3formKey ? q.web3formKey : (cleanUnusedLines ? 'tidak ada / lewati' : '[ tempel disini ]');
  lines.push(`*Jika menggunakan format quiz, masukkan form acces kode Web3form: [ ${web3KeyText} ]`);
  lines.push(`Format quiz harus memasukkan nama dan kelas siswa, bentuk soal [ ${q.bentukSoal} ]`);
  lines.push(`Sediakan tombol akses kirim ke guru [${q.namaGuru || 'nama guru'}]`);

  const securityClauses: string[] = [];
  if (q.hitungNilaiLangsung) securityClauses.push('laporan nilai jika nilai langsung dihitung');
  if (q.timerDurasi) securityClauses.push(`lama pengerjaan (sediakan timer ${q.timerMenit} menit)`);
  if (q.antiKopas) securityClauses.push('tidak bisa kopas');
  if (q.antiTranslate) securityClauses.push('tidak bisa translate');
  if (q.antiScreenshot) securityClauses.push('tidak bisa di screenshot');
  if (q.singleSubmission) securityClauses.push('satu siswa hanya bisa mengirim satu kali setelah menerima notifikasi terkirim ke guru.');

  if (securityClauses.length > 0) {
    lines.push(securityClauses.join(', '));
  }

  // HTML Gambar / Video untuk Soal Kuis
  if (data.htmlMediaSoal || !cleanUnusedLines) {
    lines.push(`- Lampiran HTML Media Gambar/Video Soal: ${data.htmlMediaSoal || '[Tempel kode HTML <img> / <video> / <iframe> ilustrasi soal disini atau kosongkan]'}`);
  }
  lines.push('');

  // 7. FORMAT KELUARAN
  lines.push('*7. FORMAT KELUARAN (pilih satu)*');
  const fmt = data.formatKeluaran;
  lines.push(`${fmt === 'A' ? '[x]' : '[ ]'} A. Peta slide saja (tabel)`);
  lines.push(`${fmt === 'B' ? '[x]' : '[ ]'} B. Naskah isi tiap slide + catatan guru`);
  lines.push(`${fmt === 'C' ? '[x]' : '[ ]'} C. HTML interaktif satu file (aktifkan Bagian C)`);
  lines.push(`${fmt === 'D' ? '[x]' : '[ ]'} D. Kerangka PPTX/Google Slides`);
  lines.push(`- Mode kerja: [${data.modeKerja}]`);
  lines.push(`- Jumlah slide: [${data.jumlahSlide || 'sesuai kebutuhan, maks 10'}]`);
  lines.push('');

  // 8. GAYA VISUAL & LAMPIRAN MEDIA
  lines.push('*8. GAYA VISUAL*');
  lines.push(`- Tema: [${data.temaVisual || (cleanUnusedLines ? '' : 'mis. Modern dengan efek dinamis dan responsif, minimalis, formal')}]`);
  lines.push(`- Palet/font: [${data.paletFont || (cleanUnusedLines ? '' : 'pilihkan')}]`);
  lines.push(`- Logo/gambar: [${data.logoGambar || (cleanUnusedLines ? '' : 'URL atau placeholder')}]`);
  if (data.htmlLogoSekolah || !cleanUnusedLines) {
    lines.push(`- Lampiran HTML Logo Sekolah: ${data.htmlLogoSekolah || '[Tempel tag HTML <img> logo sekolah disini]'}`);
  }
  if (data.htmlBackgroundSekolah || !cleanUnusedLines) {
    lines.push(`- Lampiran HTML Background / Suasana Sekolah: ${data.htmlBackgroundSekolah || '[Tempel tag HTML / CSS latar belakang sekolah disini]'}`);
  }
  if (data.htmlMediaMateri || !cleanUnusedLines) {
    lines.push(`- Lampiran HTML Media Gambar/Video Materi: ${data.htmlMediaMateri || '[Tempel tag HTML <img> / <video> / <iframe> materi disini]'}`);
  }
  lines.push(`- Emoji/ikon: [${data.emojiIkon || 'ya'}]`);
  lines.push('');

  // 9. CATATAN KHUSUS
  lines.push('*9. CATATAN KHUSUS*');
  lines.push(`- ${data.catatanKhusus || (cleanUnusedLines ? 'Tidak ada catatan khusus tambahan' : '[wajib ada / harus dihindari / slide sebelumnya sebagai acuan gaya]')}`);
  lines.push('');

  // Fixed Rules Sections B, C, D
  if (includeSectionsBCD) {
    lines.push('══ BAGIAN B. ATURAN TETAP ══');
    lines.push('1. Satu ide per slide, judul jelas, teks singkat (± maks 40 kata), ada ruang untuk aktivitas.');
    lines.push('2. Tiap aktivitas selaras dengan tujuan (A.2), mencantumkan tujuan, durasi, dan bukti belajar. Total durasi sesuai A.1.');
    lines.push('3. Scaffolding bertahap: lihat/dengar → tiru → ubah → mandiri.');
    lines.push('4. Diferensiasi: tiap aktivitas punya versi dasar dan tantangan; contoh disesuaikan dengan konteks di A.1 dan A.3.');
    lines.push('5. Variasikan jenis aktivitas. Game hanya jika dicentang di A.5; tidak semua slide berupa kuis.');
    lines.push('6. Akurasi: jangan mengarang fakta, angka, kutipan, atau tautan. Beri tanda [VERIFIKASI] jika ragu. Pakai URL hanya dari isian.');
    lines.push('7. Soal: pengecoh masuk akal, posisi jawaban benar bervariasi. Kunci dan pembahasan ditaruh di lampiran guru, bukan di slide siswa.');
    lines.push('8. Instruksi siswa singkat, bertahap, kalimat aktif.');
    lines.push('9. Jika isian kosong atau ambigu, pakai asumsi wajar dan tulis di akhir. Tanya maksimal 3 hal, hanya jika benar-benar menghambat.');
    lines.push('10. Inklusif dan aman: hindari stereotip dan data pribadi siswa di slide.');
    lines.push('');

    const isCActive = data.formatKeluaran === 'C';
    lines.push(`══ BAGIAN C. MODUL TEKNIS HTML (${isCActive ? 'aktif: A.7 = C' : 'non-aktif: hanya aktif jika A.7 = C'}) ══`);
    lines.push('- Satu file; CSS dan JS di-scope ke satu ID root agar aman ditempel di Blogger/LMS (tanpa tag html/body, tanpa style global).');
    lines.push('- Mobile-first, responsif portrait dan landscape, tinggi pakai dvh, tombol besar.');
    lines.push('- Navigasi: tombol sebelumnya/berikutnya, swipe, keyboard, nomor slide, progress bar.');
    lines.push('- Tombol layar penuh (Fullscreen API + cadangan overlay fixed).');
    lines.push('- Slide panjang bisa di-scroll di dalam kartu; tidak ada elemen yang menimpa navigasi.');
    lines.push('- Interaksi sesuai aktivitas terpilih: pilihan dengan umpan balik, kartu balik, audio TTS (hanya jika perlu), video embed (berhenti saat pindah slide).');
    lines.push('- Kuis: skor dihitung sesuai A.6.');
    lines.push('- Pengiriman hasil (jika dipilih): isi nama dan kelas dulu, semua soal wajib dijawab, kirim sekali per siswa, status berhasil/gagal jelas.');
    lines.push('- Semua hal yang harus diganti guru memakai placeholder mudah dicari, mis. GANTI-LOGO, GANTI-KUNCI-FORMULIR, GANTI-URL.');
    lines.push('- Integrasi Media: Sisipkan Lampiran HTML Logo Sekolah di sudut atas slide, Lampiran HTML Background di wrapper slide, Lampiran HTML Media Materi pada slide konsep/kegiatan, dan Lampiran HTML Media Soal pada kartu kuis.');
    lines.push('- Hormati prefers-reduced-motion; kontras teks cukup.');
    lines.push('');

    lines.push('══ BAGIAN D. PROSES & FORMAT JAWABAN ══');
    lines.push('Tahap 1: Tulis asumsi (maks 5 baris), lalu peta slide dalam tabel: No | Judul | Tujuan | Aktivitas | Durasi | Bukti belajar.');
    lines.push('Jika mode "rancangan dulu", berhenti di sini dan tanya: lanjut atau revisi?');
    lines.push('Tahap 2: Hasilkan keluaran sesuai A.7.');
    lines.push('Tahap 3: Lampiran: kunci jawaban, rubrik, catatan guru (tips fasilitasi, antisipasi miskonsepsi), dan 3 saran penyesuaian untuk kelas lain.');
    lines.push('Tanpa basa-basi.');
  }

  return lines.join('\n');
}
