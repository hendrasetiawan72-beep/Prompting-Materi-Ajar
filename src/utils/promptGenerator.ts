import { PromptFormData, BentukSoalType, AiMediaTarget } from '../types';
import { normalizeBentukSoal, DEFAULT_AI_MEDIA } from '../data/presets';

// Deskripsi tiap bentuk soal untuk prompt
const BENTUK_SOAL_DESKRIPSI: Record<BentukSoalType, { nama: string; detail: string }> = {
  'pilihan ganda': {
    nama: 'Pilihan Ganda Tunggal',
    detail: '1 jawaban benar per soal dengan elemen radio button',
  },
  mcma: {
    nama: 'Pilihan Ganda Kompleks MCMA (Multiple Choice Multiple Answer)',
    detail:
      'opsi menggunakan elemen checkbox (<input type="checkbox">), siswa wajib memilih lebih dari satu jawaban benar (misal instruksikan "Pilih 2 jawaban yang tepat"), skor dihitung proporsional',
  },
  pg_kompleks_kategori_3: {
    nama: 'Pilihan Ganda Kompleks Kategori 3 Pernyataan (Standar AKM Kurikulum Merdeka)',
    detail:
      'sediakan stimulus kontekstual diikuti tabel matriks responsif berisi tepat 3 butir pernyataan dengan opsi kategori biner Benar/Salah atau Sesuai/Tidak Sesuai menggunakan radio button per baris',
  },
  essay: {
    nama: 'Essay / Uraian Bebas',
    detail: 'sediakan textarea respon siswa beserta rubrik kriteria penilaian',
  },
};

// Ringkasan permintaan media satu target, mis. "maks 4 gambar + maks 2 video YouTube"; null jika tidak ada yang dicentang
function ringkasPermintaanMedia(t: AiMediaTarget): string | null {
  const bagian: string[] = [];
  if (t.gambar) bagian.push(`maks ${Math.max(1, t.maksGambar || 1)} gambar`);
  if (t.video) bagian.push(`maks ${Math.max(1, t.maksVideo || 1)} video YouTube`);
  return bagian.length > 0 ? bagian.join(' + ') : null;
}

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

  // Pencarian media (gambar & YouTube) oleh AI
  const aiMedia = data.aiMedia ?? DEFAULT_AI_MEDIA;
  const permintaanMateri = ringkasPermintaanMedia(aiMedia.materi);
  const permintaanSoal = ringkasPermintaanMedia(aiMedia.soal);
  const mediaAiAktif = Boolean(permintaanMateri || permintaanSoal);
  const aturanInti =
    'Hanya pakai tautan yang benar-benar kamu temukan lewat pencarian web (jangan mengarang ID video YouTube atau URL gambar); jika tidak bisa mencari, tulis placeholder GANTI-VIDEO-YOUTUBE / GANTI-GAMBAR beserta kata kunci pencarian dan tandai [VERIFIKASI].';

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
    if (item.customNote && item.customNote.trim()) {
      lines.push(`${checkMark} ${item.label}: ${item.customNote.trim()}`);
    } else if (item.label.toLowerCase().includes('slide penutup') || item.label.toLowerCase().includes('tautan lanjutan')) {
      const urlText = cleanUnusedLines ? '' : ': [URL atau hapus]';
      lines.push(`${checkMark} ${item.label}${urlText}`);
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
  const appScriptText = q.appScriptUrl ? q.appScriptUrl : (cleanUnusedLines ? 'tidak ada / lewati' : '[ tempel Web App URL Google Apps Script disini ]');

  lines.push(`Target pengiriman: [${q.submissionTarget === 'appscript' ? 'Google Spreadsheet (via Google Apps Script Web App)' : q.submissionTarget === 'web3forms' ? 'Email Guru (via Web3Forms)' : 'Keduanya (Google Spreadsheet & Web3Forms)'}]`);
  if (q.submissionTarget === 'web3forms' || q.submissionTarget === 'both') {
    lines.push(`*Jika menggunakan format quiz via Web3form, masukkan form access kode Web3form: [ ${web3KeyText} ]`);
  }
  if (q.submissionTarget === 'appscript' || q.submissionTarget === 'both') {
    lines.push(`*Jika mengirim ke Google Spreadsheet, masukkan Web App URL Google Apps Script: [ ${appScriptText} ]`);
    lines.push(`Nama sheet tujuan di Google Spreadsheet: [ ${q.sheetName || 'Nilai_Siswa'} ]`);
  }

  const bentukTerpilih = normalizeBentukSoal(q.bentukSoal);
  let bentukSoalText: string;
  if (bentukTerpilih.length === 1) {
    const b = BENTUK_SOAL_DESKRIPSI[bentukTerpilih[0]];
    bentukSoalText = `bentuk soal [ ${b.nama}: ${b.detail} ]`;
  } else {
    const rincian = bentukTerpilih
      .map((id, i) => `${i + 1}) ${BENTUK_SOAL_DESKRIPSI[id].nama}: ${BENTUK_SOAL_DESKRIPSI[id].detail}`)
      .join('; ');
    bentukSoalText = `bentuk soal [ Campuran ${bentukTerpilih.length} bentuk. Kelompokkan soal per bentuk dengan judul bagian dan petunjuk pengerjaan masing-masing, urut sesuai daftar, bagi jumlah soal secara seimbang, penomoran berkelanjutan. Rincian: ${rincian} ]`;
  }

  lines.push(`Format quiz harus memasukkan nama dan kelas siswa, ${bentukSoalText}`);
  lines.push(`Sediakan tombol akses kirim ke guru [${q.namaGuru || 'nama guru'}]`);

  const securityClauses: string[] = [];
  if (q.hitungNilaiLangsung) securityClauses.push('laporan nilai jika nilai langsung dihitung');
  if (q.timerDurasi) securityClauses.push(`lama pengerjaan (sediakan timer ${q.timerMenit} menit)`);
  if (q.antiKopas) securityClauses.push('tidak bisa kopas');
  if (q.antiTranslate) securityClauses.push('tidak bisa translate');
  if (q.antiScreenshot) securityClauses.push('tidak bisa di screenshot');
  
  if (q.singleSubmission) {
    securityClauses.push(
      'FITUR SATU KALI KIRIM: Kunci identifikasi unik = nama + kelas huruf kecil dengan spasi dirapikan (trim().toLowerCase().replace(/\\s+/g, " ")), disimpan di localStorage dan dicek di server Google Apps Script (kolom Kunci) menggunakan LockService 20 detik. Jika duplikat, server membalas {ok:false, dup:true} dan widget otomatis masuk mode latihan. Tombol kirim wajib dikunci (disabled/loading) selama proses pengiriman untuk mencegah klik ganda.'
    );
  }

  if (q.modeLatihanSetelahKirim) {
    securityClauses.push(
      'FITUR MODE LATIHAN: Saat masuk mode latihan, jawaban dan refleksi dikosongkan/reset, laporan nilai resmi tidak dikirim lagi ke spreadsheet, pencatat waktu pengerjaan dan pelacak keluar tab dihentikan. Jawaban langsung ditandai warna hijau (benar) atau merah (salah). Terdapat tombol "ULANGI LATIHAN" untuk mencoba mandiri, dan tombol "Mulai sebagai siswa baru" (dengan konfirmasi dialog) untuk perangkat HP/komputer yang dipakai bergantian antar siswa.'
    );
  }

  if (q.pantauWaktuBelajar || q.pantauKeluarTab || q.pantauLayarPenuh) {
    const monitorItems: string[] = [];
    if (q.pantauWaktuBelajar) {
      monitorItems.push(
        'waktu belajar total dan per langkah (8 langkah pembelajaran), hanya dihitung saat tab terlihat (document.hidden === false), selisih waktu lonjakan lebih dari 3 detik diabaikan (heartbeat aktif)'
      );
    }
    if (q.pantauKeluarTab) {
      monitorItems.push(
        'pelacak keluar tab (visibilitychange): hitung frekuensi keluar, total akumulasi durasi (detik), dan log detail maksimal 40 entri (jam, langkah, detik). Berikan notifikasi/peringatan saat siswa kembali ke tab'
      );
    }
    if (q.pantauLayarPenuh) {
      monitorItems.push(
        'layar penuh: sediakan tombol fullscreen, hitung berapa kali keluar layar penuh, dan sertakan cadangan fixed overlay khusus untuk iPhone / iOS Safari'
      );
    }
    securityClauses.push(`FITUR PEMANTAUAN INTEGRITAS: ${monitorItems.join('; ')}`);
  }

  if (securityClauses.length > 0) {
    lines.push(securityClauses.join('; '));
  }

  // HTML Gambar / Video untuk Soal Kuis
  if (data.htmlMediaSoal || !cleanUnusedLines) {
    lines.push(`- Lampiran HTML Media Gambar/Video Soal: ${data.htmlMediaSoal || '[Tempel kode HTML <img> / <video> / <iframe> ilustrasi soal disini atau kosongkan]'}`);
  }
  if (permintaanSoal) {
    const kataKunciSoal = aiMedia.soal.kataKunci.trim();
    lines.push(
      `- Pencarian media oleh AI (soal): [CARI di internet: ${permintaanSoal}] yang sesuai topik A.1 dan jenjang kelas, dipakai sebagai stimulus soal kuis dalam bentuk kode embed HTML siap tempel (tulis di soal nomor berapa media dipakai). Jangan membocorkan jawaban lewat gambar, keterangan, atau judul video. Lampiran HTML soal di atas (jika ada) wajib dipakai apa adanya dan dihitung dalam batas jumlah. ${aturanInti}${kataKunciSoal ? ` Kata kunci/preferensi sumber: ${kataKunciSoal}.` : ''}`
    );
  } else if (!cleanUnusedLines) {
    lines.push('- Pencarian media oleh AI (soal): [tidak dipakai]');
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
  lines.push(`- Efek & Animasi Slide: [${data.efekSlide || 'Fade Halus & Transisi Modern (Smooth Opacity & Translation)'}]`);
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
  if (permintaanMateri) {
    const kataKunciMateri = aiMedia.materi.kataKunci.trim();
    lines.push(
      `- Pencarian media oleh AI (materi): [CARI di internet: ${permintaanMateri}] yang sesuai topik A.1 dan jenjang kelas, disematkan sebagai kode embed HTML siap tempel pada slide konsep/kegiatan yang relevan. Lampiran HTML materi di atas (jika ada) wajib dipakai apa adanya dan dihitung dalam batas jumlah. ${aturanInti}${kataKunciMateri ? ` Kata kunci/preferensi sumber: ${kataKunciMateri}.` : ''}`
    );
  } else if (!cleanUnusedLines) {
    lines.push('- Pencarian media oleh AI (materi): [tidak dipakai]');
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
    lines.push(
      mediaAiAktif
        ? '6. Akurasi: jangan mengarang fakta, angka, kutipan, atau tautan. Beri tanda [VERIFIKASI] jika ragu. Pakai URL hanya dari isian atau dari hasil pencarian web yang benar-benar ditemukan sesuai aturan 11.'
        : '6. Akurasi: jangan mengarang fakta, angka, kutipan, atau tautan. Beri tanda [VERIFIKASI] jika ragu. Pakai URL hanya dari isian.'
    );
    lines.push('7. Soal: pengecoh masuk akal, posisi jawaban benar bervariasi. Kunci dan pembahasan ditaruh di lampiran guru, bukan di slide siswa.');
    lines.push('8. Instruksi siswa singkat, bertahap, kalimat aktif.');
    lines.push('9. Jika isian kosong atau ambigu, pakai asumsi wajar dan tulis di akhir. Tanya maksimal 3 hal, hanya jika benar-benar menghambat.');
    lines.push('10. Inklusif dan aman: hindari stereotip dan data pribadi siswa di slide.');
    if (mediaAiAktif) {
      lines.push('11. Pencarian media (berlaku jika A.6 / A.8 meminta AI mencari gambar atau video):');
      lines.push('   a. Cari memakai fitur pencarian web bila tersedia. Pilih media yang benar-benar relevan dengan topik dan jenjang di A.1; kualitas dan ketepatan lebih penting daripada jumlah.');
      lines.push('   b. DILARANG mengarang ID video YouTube atau URL gambar. Hanya pakai tautan yang kamu temukan sendiri dan yakin tersedia. Jika tidak punya akses pencarian web atau tidak ada hasil yang meyakinkan, jangan menebak: tulis placeholder GANTI-VIDEO-YOUTUBE / GANTI-GAMBAR di tempat media, sertakan kata kunci pencarian yang disarankan, dan tandai [VERIFIKASI] agar guru mengisinya sendiri.');
      lines.push('   c. Video YouTube: pilih kanal edukasi yang kredibel, bahasa sesuai A.1, durasi ringkas (materi idealnya maks 8 menit; stimulus soal maks 2 menit, gunakan parameter start/end untuk memotong bagian yang relevan), dan pastikan video boleh disematkan. Sematkan dengan <iframe src="https://www.youtube-nocookie.com/embed/ID_VIDEO" title="deskripsi video" loading="lazy" allowfullscreen> di dalam pembungkus responsif rasio 16:9. Di bawahnya tulis judul video, nama kanal, dan tautan "Tonton di YouTube" sebagai cadangan.');
      lines.push('   d. Gambar: utamakan sumber berlisensi terbuka (mis. Wikimedia Commons, Openverse, OpenStax, Unsplash, Pexels). Gunakan <figure><img src="URL_GAMBAR" alt="deskripsi bermakna" loading="lazy"><figcaption>keterangan + sumber/pembuat + lisensi</figcaption></figure>. Tambahkan onerror pada <img> agar menampilkan teks cadangan jika gambar gagal dimuat. Jangan memakai gambar yang menampilkan wajah atau identitas siswa.');
      lines.push('   e. Media soal hanya sebagai stimulus: jangan membocorkan kunci jawaban lewat gambar, keterangan, atau judul video. Sebutkan soal nomor berapa yang memakai media apa.');
      lines.push('   f. Patuhi batas jumlah media di A.6 dan A.8. Lampiran HTML dari guru wajib dipakai apa adanya dan dihitung dalam batas tersebut.');
      lines.push('   g. Di Lampiran guru (Tahap 3) buat daftar semua media yang disematkan: judul, jenis, sumber/kanal, tautan, lisensi, dan di slide/soal mana dipakai, agar mudah diverifikasi sebelum dipakai di kelas.');
      if (data.internet === 'offline') {
        lines.push('   h. Internet kelas OFFLINE (A.3): gambar dan video daring tidak akan tampil. Jangan mengandalkan media untuk memahami materi inti, sediakan penjelasan teks yang setara, dan beri tahu guru di akhir bahwa media perlu internet.');
      } else if (data.internet === 'terbatas') {
        lines.push('   h. Internet kelas TERBATAS (A.3): batasi video maksimal 1-2, tampilkan gambar yang ringan, aktifkan lazy loading, dan sediakan penjelasan teks yang setara bila media gagal dimuat.');
      }
    }
    lines.push('');

    const isCActive = data.formatKeluaran === 'C';
    lines.push(`══ BAGIAN C. MODUL TEKNIS HTML (${isCActive ? 'aktif: A.7 = C' : 'non-aktif: hanya aktif jika A.7 = C'}) ══`);
    lines.push('- Satu file; CSS dan JS di-scope ke satu ID root agar aman ditempel di Blogger/LMS (tanpa tag html/body, tanpa style global).');
    lines.push('- Mobile-first, responsif portrait dan landscape, tinggi pakai dvh, tombol besar.');
    lines.push('- Navigasi: tombol sebelumnya/berikutnya, swipe, keyboard, nomor slide, progress bar.');
    lines.push('- Tombol layar penuh: requestFullscreen API dengan fallback overlay fixed fullscreen khusus Safari iOS.');
    lines.push('- Slide panjang bisa di-scroll di dalam kartu; tidak ada elemen yang menimpa navigasi.');
    lines.push('- Interaksi sesuai aktivitas terpilih: pilihan dengan umpan balik, kartu balik, audio TTS (hanya jika perlu), video embed (berhenti saat pindah slide).');
    lines.push('- Kuis & Bentuk Soal Interaktif (hanya bentuk yang dipilih di A.6):');
    const bentukAktif = normalizeBentukSoal(data.quizSettings.bentukSoal);
    if (bentukAktif.includes('pilihan ganda')) {
      lines.push('  * Pilihan Ganda Tunggal: Radio button eksklusif per butir soal.');
    }
    if (bentukAktif.includes('mcma')) {
      lines.push('  * Pilihan Ganda Kompleks (MCMA): Gunakan elemen checkbox (<input type="checkbox">) dengan label interaktif, instruksikan jumlah pilihan benar (mis. "Pilih 2 jawaban yang benar"), evaluasi kombinasi jawaban benar dengan skor proporsional.');
    }
    if (bentukAktif.includes('pg_kompleks_kategori_3')) {
      lines.push('  * PG Kompleks Kategori 3 Pernyataan: Tampilkan tabel matriks responsif berisi tepat 3 butir pernyataan x kolom kategori (Benar/Salah atau Sesuai/Tidak Sesuai). Gunakan radio button per baris (<input type="radio" name="pgk_q{i}_p{1..3}">). Siswa wajib mengisi ketiga baris sebelum submit.');
    }
    if (bentukAktif.includes('essay')) {
      lines.push('  * Essay / Uraian: Textarea input dengan rubrik panduan diri.');
    }
    if (bentukAktif.length > 1) {
      lines.push('  * Karena lebih dari satu bentuk dipilih: kelompokkan soal per bentuk dengan judul bagian dan petunjuk pengerjaan sendiri, bagi jumlah soal secara seimbang, penomoran berkelanjutan, dan hitung skor gabungan sesuai skema A.6.');
    }
    lines.push('  * Skor kuis dihitung otomatis sesuai skema A.6.');
    lines.push(`- Efek & Animasi Slide: Terapkan transisi slide sesuai A.8 [${data.efekSlide || 'Fade Halus & Transisi Modern (Smooth Opacity & Translation)'}]. Gunakan CSS transitions atau keyframes berkinerja tinggi (transform & opacity) dengan easing halus, bebas lag di mobile, dan sediakan @media (prefers-reduced-motion: reduce) untuk aksesibilitas.`);
    lines.push('- MODUL KEAMANAN & PEMBATASAN SISWA (Wajib diimplementasikan di JavaScript):');
    lines.push('  1. SATU KALI KIRIM:');
    lines.push('     - Kunci identifikasi unik = nama + kelas huruf kecil dengan spasi dirapikan: key = (nama.trim().toLowerCase().replace(/\\s+/g, " ") + "_" + kelas.trim().toLowerCase().replace(/\\s+/g, " ")).');
    lines.push('     - Simpan key ke localStorage ("submitted_" + key) saat pengiriman berhasil atau jika pernah terkirim.');
    lines.push('     - Tombol kirim wajib dinonaktifkan (disabled = true, ubah teks "Mengirim...") seketika saat diklik untuk mencegah klik ganda.');
    lines.push('     - Jika server merespons { ok: false, dup: true }, tampilkan pemberitahuan "Tugas sudah pernah dikirim sebelumnya" dan otomatis panggil fungsi masuk Mode Latihan.');
    lines.push('  2. MODE LATIHAN (PRACTICE MODE):');
    lines.push('     - Saat widget memasuki mode latihan: kosongkan/reset semua pilihan jawaban dan isian refleksi/esai.');
    lines.push('     - Nonaktifkan tombol kirim ke server (tidak ada data yang dikirim ulang ke spreadsheet).');
    lines.push('     - Hentikan interval timer pengerjaan dan pencatat waktu/keluar tab.');
    lines.push('     - Aktifkan evaluasi instan: setiap opsi yang dipilih siswa langsung ditandai warna hijau (benar) atau merah (salah) beserta pembahasan.');
    lines.push('     - Sediakan tombol "ULANGI LATIHAN" yang mereset pilihan latihan tanpa mengubah skor resmi yang sudah tersimpan.');
    lines.push('     - Sediakan tombol "Mulai sebagai siswa baru" dengan prompt konfirmasi (confirm("Mulai sesi baru untuk siswa lain? Perangkat ini akan dibersihkan untuk pengguna berikutnya.")). Jika ya, hapus cache localStorage dan izinkan pengisian identitas baru.');
    lines.push('  3. PEMANTAUAN BELAJAR & INTEGRITAS:');
    lines.push('     - Waktu belajar aktif: Catat total durasi dan waktu per langkah (array 8 langkah). Hitung HANYA saat tab terlihat (!document.hidden). Selisih waktu (delta) lebih dari 3 detik diabaikan/dilewati agar durasi akurat saat perangkat sleep.');
    lines.push('     - Pelacak Keluar Tab (visibilitychange): Tambah hitungan keluar tab (counter), akumulasi durasi keluar tab (detik), dan simpan log detail maksimal 40 entri [{ jam: "HH:MM:SS", langkah: N, detik: S }].');
    lines.push('     - Tampilkan modal/alert peringatan integritas saat siswa kembali ke tab: "Peringatan: Kamu terdeteksi keluar dari slide materi selama X detik."');
    lines.push('     - Layar penuh (Fullscreen): Pasang tombol toggle fullscreen. Pasang event listener fullscreenchange untuk menghitung frekuensi keluar dari layar penuh. Sediakan fallback class fixed overlay untuk perangkat iOS/iPhone.');
    lines.push('- Pengiriman ke Google Spreadsheet (Apps Script): Gunakan fetch POST ke URL Apps Script dengan body JSON: { kunci, nama, kelas, skor, durasiTotal, durasiPerLangkah, keluarTabCount, keluarTabDurasi, keluarTabLog, keluarFullscreenCount, jawaban }. Berikan umpan balik loading dan penanganan response { ok: true } vs { ok: false, dup: true }.');
    lines.push('- Semua hal yang harus diganti guru memakai placeholder mudah dicari, mis. GANTI-LOGO, GANTI-KUNCI-FORMULIR, GANTI-URL-APPSCRIPT, GANTI-URL.');
    lines.push('- Integrasi Media: Sisipkan Lampiran HTML Logo Sekolah di sudut atas slide, Lampiran HTML Background di wrapper slide, Lampiran HTML Media Materi pada slide konsep/kegiatan, dan Lampiran HTML Media Soal pada kartu kuis.');
    if (mediaAiAktif) {
      lines.push('- Media hasil pencarian AI (A.6 / A.8): bungkus tiap embed dalam komponen responsif (YouTube rasio 16:9 dengan lebar maks 100%; gambar max-width:100% dan height:auto), jaga agar tidak menimpa navigasi slide, dan hentikan video saat siswa pindah slide (reset src iframe atau pakai YouTube iframe API dengan enablejsapi=1).');
    }
    lines.push('- Hormati prefers-reduced-motion; kontras teks cukup.');
    lines.push('');

    lines.push('══ BAGIAN D. PROSES & FORMAT JAWABAN ══');
    lines.push('Tahap 1: Tulis asumsi (maks 5 baris), lalu peta slide dalam tabel: No | Judul | Tujuan | Aktivitas | Durasi | Bukti belajar.');
    lines.push('Jika mode "rancangan dulu", berhenti di sini dan tanya: lanjut atau revisi?');
    lines.push('Tahap 2: Hasilkan keluaran sesuai A.7.');
    lines.push('Tahap 3: Lampiran: kunci jawaban, rubrik, catatan guru (tips fasilitasi, antisipasi miskonsepsi), 3 saran penyesuaian untuk kelas lain, serta kode lengkap Google Apps Script (doPost) yang menerapkan LockService 20 detik, validasi kolom Kunci (menghasilkan { ok: false, dup: true } jika duplikat), dan pencatatan telemetri pemantauan integritas.');
    if (mediaAiAktif) {
      lines.push('Tambahan Tahap 3: daftar media gambar/video yang disematkan (judul, jenis, sumber/kanal, tautan, lisensi, dipakai di slide/soal mana) sesuai aturan B.11.');
    }
    lines.push('Tanpa basa-basi.');
  }

  return lines.join('\n');
}
