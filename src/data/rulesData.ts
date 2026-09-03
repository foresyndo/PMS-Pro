export interface RuleItem {
  id: string;
  category: "kos" | "hotel" | "karyawan_fo" | "karyawan_hk" | "karyawan_security" | "sanksi";
  title: string;
  code: string; // misal: KOS-01, HTL-01, SOP-FO-01
  severity?: "Wajib" | "Larangan Keras" | "Standar Operasional" | "Ketentuan Umum";
  summary: string;
  details: string[];
  penalty?: string;
  iconType?: string;
}

export const KOS_RULES: RuleItem[] = [
  {
    id: "kos-1",
    category: "kos",
    code: "KOS-01",
    title: "Ketentuan Administrasi, Identitas & Uang Jaminan (Deposit)",
    severity: "Wajib",
    summary: "Setiap calon penghuni wajib menyerahkan data identitas resmi dan membayar uang jaminan sewa sebelum menempati kamar.",
    details: [
      "Menyerahkan fotokopi / foto KTP atau Paspor asli yang masih berlaku, serta melampirkan nomor kontak darurat keluarga (orang tua/wali/kerabat terdekat).",
      "Bagi pasangan suami istri, wajib melampirkan salinan resmi Surat Nikah / Kartu Keluarga yang sah saat mendaftar.",
      "Membayar uang sewa bulan pertama dan uang deposit jaminan (security deposit) sebesar 1 (satu) bulan sewa atau minimal Rp 500.000.",
      "Uang deposit akan dikembalikan penuh saat masa sewa berakhir setelah kamar diperiksa oleh pengelola dan dipastikan tidak ada tunggakan tagihan, kerusakan fasilitas, atau kehilangan kunci.",
      "Pemberitahuan berhenti sewa (Check-out) wajib disampaikan kepada manajemen minimal 30 (tiga puluh) hari sebelum tanggal jatuh tempo sewa berikutnya."
    ],
    penalty: "Penundaan serah terima kunci kamar dan pemotongan deposit sepihak jika keluar tanpa konfirmasi H-30."
  },
  {
    id: "kos-2",
    category: "kos",
    code: "KOS-02",
    title: "Jatuh Tempo Pembayaran Sewa & Denda Keterlambatan",
    severity: "Wajib",
    summary: "Pembayaran sewa dilakukan secara terjadwal setiap awal siklus sewa untuk menjaga kelancaran operasional.",
    details: [
      "Pembayaran sewa bulanan wajib dilunasi paling lambat pada tanggal jatuh tempo yang tertera di kontrak sewa digital (maksimal tanggal 5 setiap bulannya).",
      "Pembayaran dilakukan secara non-tunai melalui transfer bank resmi manajemen kos atau payment gateway yang terdaftar di aplikasi PMS PRO.",
      "Bukti pembayaran wajib diunggah ke sistem atau dikonfirmasi ke kasir / pengelola kos untuk diterbitkan invoice lunas.",
      "Pengingat tagihan otomatis (WhatsApp reminder) akan dikirimkan pada H-3 sebelum tanggal jatuh tempo."
    ],
    penalty: "Denda keterlambatan sebesar Rp 50.000 per hari sejak H+1 jatuh tempo. Jika menunggak lebih dari 7 hari, pengelola berhak menyegel kamar sementara."
  },
  {
    id: "kos-3",
    category: "kos",
    code: "KOS-03",
    title: "Jam Bertamu, Jam Malam Gerbang & Kebijakan Menginap",
    severity: "Larangan Keras",
    summary: "Mengatur tata tertib penerimaan tamu luar demi keamanan dan kenyamanan seluruh penghuni kos.",
    details: [
      "Waktu bertamu untuk tamu luar berlaku pukul 08:00 WIB hingga maksimal pukul 22:00 WIB.",
      "Tamu wajib diterima di Ruang Tamu Bersama / Lobi Depan. Tamu dilarang masuk ke dalam kamar penghuni (kecuali keluarga kandung sesama jenis kelamin dengan izin pengelola).",
      "Pintu gerbang utama ditutup dan dikunci gembok otomatis pada pukul 23:00 WIB demi keamanan. Penghuni yang pulang lewat jam malam wajib membawa kunci gerbang cadangan / lapor ke penjaga keamanan.",
      "DILARANG KERAS membawa tamu lawan jenis masuk ke dalam kamar tidur (kecuali pasutri sah berdokumen resmi) atau menginapkan lawan jenis.",
      "Tamu sesama jenis yang ingin menginap wajib melapor ke pengelola maksimal pukul 20:00 WIB dan dikenakan biaya tamu menginap Rp 50.000/malam (maksimal 2 malam berturut-turut)."
    ],
    penalty: "Teguran keras dan denda Rp 250.000. Untuk pelanggaran membawa lawan jenis ke kamar: pemutusan sewa sepihak tanpa pengembalian uang sewa."
  },
  {
    id: "kos-4",
    category: "kos",
    code: "KOS-04",
    title: "Ketenangan, Jam Hening (Quiet Hours) & Toleransi Bersama",
    severity: "Wajib",
    summary: "Menjaga lingkungan kos yang kondusif untuk istirahat, belajar, dan kenyamanan seluruh penghuni.",
    details: [
      "Jam hening (Quiet Hours) berlaku setiap hari mulai pukul 22:00 WIB sampai dengan 06:00 WIB.",
      "Selama jam hening, dilarang memutar musik keras, bermain instrumen musik, berteriak, mengobrol keras di lorong, atau membanting pintu.",
      "Penggunaan speaker di siang hari wajib dalam batas wajar dan tidak menembus dinding kamar tetangga. Sangat disarankan menggunakan earphone/headset.",
      "Dilarang mengadakan pesta atau pertemuan kelompok besar di dalam area kos tanpa persetujuan tertulis dari pengelola."
    ],
    penalty: "Peringatan tertulis (SP-1). Tiga kali pelanggaran berujung pada pemutusan kontrak sewa."
  },
  {
    id: "kos-5",
    category: "kos",
    code: "KOS-05",
    title: "Kebersihan Kamar Pribadi, Area Bersama & Dapur Kos",
    severity: "Standar Operasional",
    summary: "Kebersihan adalah tanggung jawab bersama antara penghuni dan pengelola kos.",
    details: [
      "Penghuni wajib menjaga kebersihan kamar pribadi masing-masing dan membuang sampah dalam kantong tertutup ke tempat sampah utama setiap hari.",
      "Dapur bersama: Wajib mencuci dan mengeringkan peralatan masak/makan pribadi segera setelah selesai digunakan (dilarang menumpuk piring di wastafel).",
      "Dapur bersama: Bersihkan kompor dan meja dapur dari cipratan minyak/bumbu setelah memasak.",
      "Area jemuran: Angkat pakaian yang sudah kering dalam waktu maksimal 1x24 jam untuk memberi ruang bagi penghuni lain.",
      "Dilarang menaruh barang pribadi (sepatu berserakan, galon air, kardus kotor) di lorong umum depan kamar yang dapat mengganggu akses jalan."
    ],
    penalty: "Barang berserakan di lorong yang tidak dipindahkan dalam 24 jam akan dipindahkan oleh staf ke gudang penampungan."
  },
  {
    id: "kos-6",
    category: "kos",
    code: "KOS-06",
    title: "Penggunaan Daya Listrik & Peralatan Elektronik Berdaya Tinggi",
    severity: "Ketentuan Umum",
    summary: "Standar penggunaan instalasi listrik kamar demi mencegah kelebihan beban (overload) dan bahaya kebakaran.",
    details: [
      "Harga sewa standar mencakup penggunaan: Lampu kamar, kipas angin / AC standar kamar, charger laptop, dan charger ponsel.",
      "Penggunaan alat elektronik berdaya tinggi (seperti kulkas mini, dispenser air panas/dingin, microwave, rice cooker besar, air fryer, atau kompor induksi) WAJIB didaftarkan ke pengelola.",
      "Setiap peralatan elektronik tambahan yang disetujui dikenakan biaya tambahan listrik rata-rata Rp 50.000 - Rp 100.000 per unit per bulan.",
      "DILARANG mengubah instalasi listrik kamar, membongkar stopkontak, atau menyambung kabel secara ilegal (by-pass MCB).",
      "Wajib mematikan lampu, kipas angin/AC, dan mencabut colokan listrik saat meninggalkan kamar untuk bepergian."
    ],
    penalty: "Denda Rp 200.000 dan penyitaan alat elektronik ilegal hingga akhir masa sewa."
  },
  {
    id: "kos-7",
    category: "kos",
    code: "KOS-07",
    title: "Larangan Keras Narkoba, Miras, Perjudian, Senjata & Asusila",
    severity: "Larangan Keras",
    summary: "Toleransi Nol (Zero Tolerance) terhadap segala bentuk aktivitas melawan hukum Republik Indonesia.",
    details: [
      "DILARANG KERAS membawa, menyimpan, mengonsumsi, mengedarkan, atau memperjualbelikan Narkotika, Psikotropika, dan Zat Adiktif terlarang lainnya di area kos.",
      "DILARANG membawa atau mengonsumsi minuman keras beralkohol di dalam kamar maupun di area umum kos.",
      "DILARANG keras menyimpan senjata api, senjata tajam tanpa izin, petasan, bahan kimia berbahaya, atau bahan peledak.",
      "DILARANG menjadikan kamar kos sebagai tempat perjudian, penipuan online, atau tindakan asusila / prostitusi.",
      "Pihak pengelola berhak melakukan inspeksi mendadak didampingi petugas keamanan / pengurus RT/RW jika ada indikasi tindak pidana."
    ],
    penalty: "PEMUTUSAN KONTRAK SEKETIKA, uang sewa & deposit hangus, serta dilaporkan langsung ke pihak Kepolisian RI."
  },
  {
    id: "kos-8",
    category: "kos",
    code: "KOS-08",
    title: "Parkir Kendaraan & Keamanan Barang Berharga Pribadi",
    severity: "Standar Operasional",
    summary: "Aturan penataan kendaraan di area parkir dan tanggung jawab perlindungan barang pribadi.",
    details: [
      "Setiap penghuni berhak atas 1 (satu) slot parkir sepeda motor yang terdaftar. Parkir mobil wajib konfirmasi ketersediaan slot dan tarif parkir mobil bulanan.",
      "Kendaraan wajib diparkir rapi di dalam garis marka, dikunci stang, dan tidak menghalangi jalur keluar masuk kendaraan lain.",
      "Dilarang meninggalkan kunci kendaraan pada kontak motor, helm mahal tanpa gembok, atau barang berharga di bagasi luar.",
      "Pintu kamar wajib selalu terkunci saat ditinggalkan. Pengelola tidak bertanggung jawab atas kehilangan barang pribadi di dalam kamar akibat kelalaian penghuni tidak mengunci pintu."
    ],
    penalty: "Peringatan dan larangan memasukkan kendaraan ke dalam area kos jika berulang kali parkir sembarangan."
  },
  {
    id: "kos-9",
    category: "kos",
    code: "KOS-09",
    title: "Larangan Merokok di Kamar Ber-AC & Kebijakan Hewan Peliharaan",
    severity: "Larangan Keras",
    summary: "Menjaga kualitas udara dan kebersihan dinding serta perabotan kamar sewa.",
    details: [
      "DILARANG KERAS merokok (rokok konvensional maupun rokok elektrik/vape) di dalam kamar ber-AC, kamar mandi dalam, atau lorong kamar beratap tertutup.",
      "Merokok HANYA diperkenankan di area terbuka yang telah disediakan (balkon terbuka / smoking area taman belakang).",
      "Puntung rokok wajib dimatikan sempurna dan dibuang ke asbak khusus, bukan ke dalam pot tanaman atau lantai.",
      "Kecuali ditentukan lain secara tertulis oleh pengelola, hewan peliharaan (anjing, kucing, reptil, burung kicau) TIDAK DIPERKENANKAN di dalam kamar kos demi kenyamanan alergi dan kebersihan bersama."
    ],
    penalty: "Denda pembersihan dinding & cuci AC sebesar Rp 350.000 per pelanggaran merokok."
  }
];

export const HOTEL_RULES: RuleItem[] = [
  {
    id: "htl-1",
    category: "hotel",
    code: "HTL-01",
    title: "Waktu Check-In, Check-Out & Ketentuan Late Check-Out",
    severity: "Wajib",
    summary: "Standar jadwal operasional kamar untuk memastikan waktu pembersihan yang cukup bagi staf Housekeeping.",
    details: [
      "Waktu Check-In standar dimulai pukul 14:00 WIB (Early check-in tergantung ketersediaan kamar dan dapat dikenakan biaya tambahan).",
      "Waktu Check-Out standar paling lambat pukul 12:00 WIB siang.",
      "Permintaan perpanjangan waktu (Late check-out) wajib dikonfirmasi ke resepsionis Front Office paling lambat pukul 10:00 WIB pada hari kepulangan.",
      "Keterlambatan Check-out antara pukul 12:00 - 15:00 WIB dikenakan biaya 50% dari harga sewa harian kamar.",
      "Check-out setelah pukul 15:00 WIB akan dikenakan biaya 100% tarif kamar untuk 1 (satu) malam penuh."
    ],
    penalty: "Pemotongan otomatis dari kartu kredit/deposit jaminan untuk late check-out tanpa konfirmasi."
  },
  {
    id: "htl-2",
    category: "hotel",
    code: "HTL-02",
    title: "Uang Jaminan Menginap (Security Deposit)",
    severity: "Wajib",
    summary: "Jaminan transaksi selama menginap untuk fasilitas tambahan, minibar, dan perlindungan aset kamar.",
    details: [
      "Saat proses Check-In, tamu wajib memberikan deposit jaminan sebesar Rp 200.000 - Rp 500.000 per kamar (bisa berupa uang tunai atau pre-otorisasi kartu kredit/debit).",
      "Deposit jaminan digunakan sebagai jaminan pembayaran pemakaian minibar, layanan laundry kilat, layanan room service, atau ganti rugi kerusakan inventaris kamar.",
      "Deposit tunai akan dikembalikan penuh pada saat Check-Out setelah staf Housekeeping melakukan inspeksi kamar dan menyatakan kondisi kamar baik.",
      "Pengembalian via transfer bank / release pre-auth kartu kredit membutuhkan waktu 1-3 hari kerja perbankan."
    ],
    penalty: "Kamar tidak dapat diserahterimakan tanpa penyerahan deposit jaminan dan tanda pengenal resmi."
  },
  {
    id: "htl-3",
    category: "hotel",
    code: "HTL-03",
    title: "Kebijakan Bebas Rokok (100% Smoke-Free / Non-Smoking Rooms)",
    severity: "Larangan Keras",
    summary: "Perlindungan kesehatan tamu dan pencegahan kerusakan kain sprei, gorden, serta sistem detektor asap (smoke detector).",
    details: [
      "Seluruh kamar tipe Non-Smoking, koridor lift, lobi, dan area restoran ber-AC adalah zona 100% BEBAS ASAP ROKOK (termasuk vape, shisha, dan rokok tembakau).",
      "Setiap kamar dilengkapi dengan sensor asap sensitif (optical smoke detector) yang terhubung langsung ke alarm sistem pemadam kebakaran gedung.",
      "Tamu yang ingin merokok dipersilakan menggunakan area merokok terbuka (outdoor garden / smoking terrace) yang telah disediakan di lantai dasar / rooftop.",
      "Jika ditemukan puntung rokok, abu rokok, bau asap rokok yang menempel pada gorden/sprei/karpet di kamar non-smoking, tamu akan dikenakan biaya pembersihan khusus."
    ],
    penalty: "Denda Deep Cleaning & Deodorizing (Ozone Treatment) sebesar Rp 1.000.000 - Rp 1.500.000 per kamar."
  },
  {
    id: "htl-4",
    category: "hotel",
    code: "HTL-04",
    title: "Batas Kapasitas Penghuni Kamar & Kebijakan Tamu Tambahan",
    severity: "Standar Operasional",
    summary: "Menjaga kenyamanan, keselamatan kapasitas beban lantai, dan standar evakuasi keselamatan hotel.",
    details: [
      "Kapasitas maksimal per kamar Standar / Deluxe adalah 2 (dua) orang dewasa dan 1 (satu) anak di bawah usia 6 tahun.",
      "Tamu tambahan di atas usia 10 tahun wajib menggunakan kasur tambahan (Extra Bed) dengan biaya resmi Rp 150.000 - Rp 250.000 per malam (termasuk set amenities dan sarapan tambahan).",
      "Tamu yang berkunjung ke kamar hotel wajib melapor dan menitipkan identitas KTP di meja Front Office.",
      "Tamu luar yang berkunjung hanya diperbolehkan berada di kamar maksimal sampai pukul 22:00 WIB demi menjaga privasi tamu kamar lain."
    ],
    penalty: "Penambahan biaya extra bed otomatis pada tagihan final jika penghuni melebihi kapasitas tanpa pemberitahuan."
  },
  {
    id: "htl-5",
    category: "hotel",
    code: "HTL-05",
    title: "Ganti Rugi Kerusakan, Noda Permanen & Kehilangan Inventaris",
    severity: "Wajib",
    summary: "Tanggung jawab tamu terhadap perabotan, perangkat elektronik, dan linen selama masa tinggal.",
    details: [
      "Tamu wajib menjaga seluruh fasilitas kamar (TV Smart LED, remote AC, hair dryer, cerek listrik, brankas, meja, kursi, tirai, dan kaca).",
      "Kerusakan atau noda permanen pada linen (tinta, darah, cat rambut, luka bakar rokok, make-up minyak tahan air) yang tidak bisa dibersihkan melalui pencucian normal akan dikenakan biaya penggantian.",
      "Biaya kehilangan Keycard akses kamar: Rp 50.000 per kartu.",
      "Biaya penggantian handuk mandi bernoda permanen/hilang: Rp 100.000 per helai; Sarung bantal: Rp 50.000; Sprei/Bed Sheet: Rp 250.000; Duvet Cover: Rp 400.000.",
      "Pecah belah (gelas, cangkir, piring): Rp 35.000 - Rp 75.000 per item."
    ],
    penalty: "Biaya ganti rugi akan langsung dipotong dari deposit menginap atau ditagihkan pada invoice check-out."
  },
  {
    id: "htl-6",
    category: "hotel",
    code: "HTL-06",
    title: "Penyimpanan Barang Berharga & Batasan Tanggung Jawab (Disclaimer)",
    severity: "Ketentuan Umum",
    summary: "Panduan pengamanan uang tunai, dokumen penting, dan perhiasan berharga milik tamu.",
    details: [
      "Setiap kamar tamu dilengkapi dengan Brankas Digital Elektronik (Safety Deposit Box / SDB). Tamu sangat disarankan menyimpan uang tunai, perhiasan, paspor, dan gadget di dalam brankas.",
      "Petunjuk pengoperasian brankas tertera di bagian pintu brankas atau dapat dibantu oleh staf Front Office.",
      "Pihak manajemen hotel TIDAK BERTANGGUNG JAWAB atas kehilangan, pencurian, atau kerusakan barang berharga yang ditinggalkan tanpa pengawasan di area terbuka kamar atau lobi.",
      "Barang berharga yang tertinggal saat check-out akan dicatat dalam register Lost & Found hotel dan disimpan maksimal selama 6 (enam) bulan."
    ],
    penalty: "Kelalaian penyimpanan barang berharga di luar SDB merupakan tanggung jawab pribadi masing-masing tamu."
  },
  {
    id: "htl-7",
    category: "hotel",
    code: "HTL-07",
    title: "Larangan Buah Durian, Bahan Berbau Tajam & Hewan Peliharaan",
    severity: "Larangan Keras",
    summary: "Menjaga kesegaran udara sirkulasi AC sentral dan kenyamanan tamu berikutnya.",
    details: [
      "DILARANG KERAS membawa buah Durian, Nangka, Cempedak, atau makanan dengan aroma menyengat (seperti terasi mentah) ke dalam kamar hotel dan area lobi ber-AC.",
      "Aroma durian dapat masuk ke dalam saluran filter pendingin udara (AC coil) dan membutuhkan waktu berhari-hari untuk dinetralkan.",
      "Hewan peliharaan (anjing, kucing, burung, hewan reptil) dilarang dibawa masuk ke dalam seluruh area hotel, kecuali properti bertanda khusus Pet-Friendly.",
      "Dilarang memasak di dalam kamar yang tidak dilengkapi fasilitas dapur (kitchenette) menggunakan kompor gas portable atau kompor listrik pribadi."
    ],
    penalty: "Denda sterilisasi aroma dan pembersihan filter AC sebesar Rp 500.000 per insiden."
  }
];

export const FO_STAFF_RULES: RuleItem[] = [
  {
    id: "fo-1",
    category: "karyawan_fo",
    code: "SOP-FO-01",
    title: "Standar Grooming, Seragam & Penampilan Resepsionis",
    severity: "Wajib",
    summary: "Front Office adalah cermin pertama wajah perusahaan. Standar penampilan harus selalu prima, higienis, dan profesional.",
    details: [
      "Wajib mengenakan seragam resmi perusahaan yang bersih, disetrika rapi, tidak kusut, dan memasang nametag di dada sebelah kiri.",
      "Karyawan Pria: Rambut dipotong rapi pendek (tidak menyentuh kerah baju), wajah bersih dicukur (tanpa jenggot/kumis berantakan), menggunakan sepatu pantofel hitam mengkilap berkaus kaki hitam.",
      "Karyawan Wanita: Rambut diikat rapi menggunakan hairnet / cepol formal (bagi yang tidak berhijab). Bagi yang berhijab, gunakan jilbab polos rapi sesuai warna standar seragam.",
      "Riasan wajah (make-up) natural dan segar (tidak pucat dan tidak terlalu mencolok), kuku dipotong pendek bersih tanpa cat kuku warna mencolok.",
      "Wajib menjaga aroma tubuh dan kesegaran nafas (gunakan parfum segar dengan aroma lembut dan hindari makanan berbau menyengat sebelum bertugas)."
    ],
    penalty: "Teguran langsung oleh Duty Manager, tidak diperkenankan berdiri di front desk sebelum merapikan penampilan."
  },
  {
    id: "fo-2",
    category: "karyawan_fo",
    code: "SOP-FO-02",
    title: "Golden Rule 3-Detik Greeting & Pelayanan 5S",
    severity: "Standar Operasional",
    summary: "Memberikan sambutan hangat kepada setiap tamu yang melangkah menuju front desk.",
    details: [
      "Terapkan aturan 3-Detik: Sambut tamu dalam waktu maksimal 3 detik saat tamu mendekati meja resepsionis.",
      "Berdiri tegak, lakukan kontak mata hangat, tersenyum ramah, dan lakukan salam penghormatan (tangan mengatup di dada atau sikap siap melayani).",
      "Ucapkan sapaan formal sesuai waktu: 'Selamat pagi/siang/malam, selamat datang di [Nama Properti]. Ada yang bisa saya bantu Bapak/Ibu?'.",
      "Panggil nama tamu sesering mungkin setelah mengetahui namanya (contoh: 'Baik, Bapak Anton, proses check-in sedang kami siapkan').",
      "Terapkan budaya 5S: Senyum, Salam, Sapa, Sopan, dan Santun dalam setiap interaksi tatap muka maupun telepon."
    ],
    penalty: "Poin evaluasi berkala kinerja mingguan dan coaching personal oleh Supervisor FO."
  },
  {
    id: "fo-3",
    category: "karyawan_fo",
    code: "SOP-FO-03",
    title: "SOP Prosedur Check-In Tamu Cepat & Tepat (7 Langkah)",
    severity: "Standar Operasional",
    summary: "Alur kerja standar saat memproses kedatangan tamu hotel maupun penyewa kos baru.",
    details: [
      "Langkah 1: Sambut tamu dengan ramah dan tanyakan nama pemesan atau nomor konfirmasi reservasi.",
      "Langkah 2: Cari data reservasi di sistem PMS PRO. Konfirmasi tipe kamar, jumlah malam menginap, dan jumlah tamu.",
      "Langkah 3: Minta kartu identitas asli (KTP / Paspor / SIM) untuk dicocokkan dengan reservasi dan diarsipkan ke sistem database.",
      "Langkah 4: Jelaskan fasilitas kamar, jam sarapan pagi, lokasi lift, dan informasi password koneksi Wi-Fi.",
      "Langkah 5: Minta deposit jaminan menginap (cash/kartu) dan cetak bukti penerimaan deposit resmi.",
      "Langkah 6: Program kartu kunci (keycard) sesuai nomor kamar yang telah berstatus 'Clean & Inspected'.",
      "Langkah 7: Serahkan keycard dengan kedua tangan, ucapkan nomor kamar dengan nada sopan tanpa berteriak di depan umum demi privasi keamanan tamu: 'Kamar Bapak berada di lantai 3, silakan gunakan lift di sebelah kanan. Selamat beristirahat!'."
    ],
    penalty: "Waktu proses check-in ditargetkan maksimal 3-5 menit per tamu untuk mencegah antrean panjang di lobi."
  },
  {
    id: "fo-4",
    category: "karyawan_fo",
    code: "SOP-FO-04",
    title: "SOP Prosedur Check-Out & Koordinasi Cepat Housekeeping",
    severity: "Standar Operasional",
    summary: "Memastikan proses kepulangan tamu lancar tanpa kerugian aset kamar atau sengketa tagihan.",
    details: [
      "Langkah 1: Sambut tamu yang datang ke meja resepsionis: 'Selamat pagi/siang Bapak/Ibu, apakah hari ini akan melakukan check-out?'.",
      "Langkah 2: Terima keycard dan tanyakan nomor kamar tamu.",
      "Langkah 3: Segera hubungi tim Housekeeping melalui walkie-talkie / chat internal PMS: 'Mohon check room [Nomor Kamar], tamu sedang check-out'.",
      "Langkah 4: Tanyakan pengalaman menginap tamu secara tulus: 'Bagaimana pengalaman istirahat Bapak/Ibu selama menginap bersama kami? Apakah ada masukan?'.",
      "Langkah 5: Tunggu laporan Housekeeping (maksimal 2 menit) mengenai status minibar, kelengkapan inventaris, atau barang tertinggal.",
      "Langkah 6: Cetak faktur tagihan final (folio), proses pembayaran sisa tagihan jika ada, atau kembalikan uang deposit utuh.",
      "Langkah 7: Berikan kuitansi lunas, ucapkan terima kasih tulus, dan tawarkan bantuan transportasi / penitipan koper."
    ],
    penalty: "Kelalaian koordinasi minibar yang menyebabkan kerugian ditanggung oleh petugas FO yang bertugas."
  },
  {
    id: "fo-5",
    category: "karyawan_fo",
    code: "SOP-FO-05",
    title: "SOP Penanganan Komplain Tamu dengan Metode L.A.S.T",
    severity: "Wajib",
    summary: "Mengubah tamu yang kecewa menjadi tamu loyal melalui penanganan keluhan yang tenang dan solutif.",
    details: [
      "L - LISTEN (Dengarkan Aktif): Dengarkan seluruh keluhan tamu dengan tatapan empati dan penuh perhatian. Jangan pernah memotong pembicaraan, membantah, atau menyalahkan tamu.",
      "A - APOLOGIZE (Minta Maaf Tulus): Ucapkan permohonan maaf dengan tulus atas ketidaknyamanan yang terjadi, contoh: 'Kami mohon maaf yang sebesar-besarnya atas kendala AC yang kurang dingin di kamar Bapak'.",
      "S - SOLVE (Beri Solusi Konkret): Ambil tindakan nyata segera. Hubungi teknisi maintenance untuk perbaikan dalam 15 menit, atau tawarkan pindah kamar jika kamar tidak dapat segera diperbaiki.",
      "T - THANK (Ucapkan Terima Kasih & Follow Up): Ucapkan terima kasih atas masukan yang diberikan tamu. Hubungi kembali kamar tamu 30 menit kemudian untuk memastikan keluhan telah teratasi dengan baik."
    ],
    penalty: "Dilarang berdebat dengan tamu. Jika situasi memanas, wajib segera memanggil Duty Manager / Pengelola."
  },
  {
    id: "fo-6",
    category: "karyawan_fo",
    code: "SOP-FO-06",
    title: "SOP Serah Terima Shift (Handover) & Kas Kecil (Petty Cash)",
    severity: "Wajib",
    summary: "Memastikan kontinuitas operasional tanpa ada informasi krusial yang terputus antar pergantian jam kerja.",
    details: [
      "Petugas shift berikutnya wajib hadir 15 menit sebelum jam shift dimulai untuk persiapan briefing.",
      "Hitung uang tunai di laci kasir (float cash / petty cash) bersama-sama antara kasir shift lama dan shift baru, cocokkan dengan laporan sistem kasir PMS PRO.",
      "Buka buku log (Log Book) dan baca seluruh pesan penting: daftar tamu VIP, permintaan khusus (wake-up call, extra bed), keluhan yang belum terselesaikan, dan status kamar pending.",
      "Periksa keberadaan master keycard dan kunci cadangan fisik di lemari kunci resepsionis.",
      "Kedua petugas shift menandatangani form serah terima (handover sheet) di hadapan Supervisor."
    ],
    penalty: "Selisih kasir yang tidak dilaporkan saat serah terima menjadi tanggung jawab petugas shift yang bertugas saat itu."
  }
];

export const HK_STAFF_RULES: RuleItem[] = [
  {
    id: "hk-1",
    category: "karyawan_hk",
    code: "SOP-HK-01",
    title: "Standar Grooming, APD & Kebersihan Diri Tim Housekeeping",
    severity: "Wajib",
    summary: "Memastikan staf housekeeping bekerja dengan higienis, aman, dan berpenampilan bersih.",
    details: [
      "Mengenakan seragam housekeeping yang bersih, rapi, dan sepatu kerja bertumit karet anti-slip (safety shoes).",
      "Wajib mengenakan Alat Pelindung Diri (APD) saat bertugas: sarung tangan karet (rubber gloves) saat membersihkan toilet dan masker hidung saat menangani debu/bahan kimia.",
      "Rambut rapi, kuku pendek dan bersih, tidak memakai cincin bermata besar atau perhiasan berlebihan yang dapat menggores perabot kamar.",
      "Trolley housekeeping (caddy cart) harus ditata rapi, bersih dari sampah tercecer, dan tidak menghalangi jalur evakuasi di lorong hotel."
    ],
    penalty: "Peringatan keselamatan kerja dan larangan memasuki area kamar sebelum melengkapi APD."
  },
  {
    id: "hk-2",
    category: "karyawan_hk",
    code: "SOP-HK-02",
    title: "SOP Standar Mengetuk & Memasuki Kamar Tamu (Knocking Procedure)",
    severity: "Wajib",
    summary: "Menghormati privasi tamu dan menjaga etika formal sebelum membuka pintu kamar.",
    details: [
      "Periksa status kamar di sistem PMS: Jangan pernah mengetuk kamar dengan tanda 'DND' (Do Not Disturb) menyala, kecuali ada instruksi darurat dari Duty Manager.",
      "Ketuk pintu dengan buku jari sebanyak 3 (tiga) kali secara berirama (tidak terlalu keras dan tidak pelan).",
      "Ucapkan dengan jelas dan sopan: 'Housekeeping, permisi...'. Tunggu 5-7 detik untuk mendengarkan respon dari dalam.",
      "Jika tidak ada jawaban, ulangi mengetuk 3 kali dan ucapkan kembali: 'Housekeeping, selamat pagi/siang...'.",
      "Jika tetap tidak ada jawaban setelah 3 kali mencoba, gunakan master keycard untuk membuka pintu secara perlahan maksimal 3-5 cm, ucapkan kembali salam sebelum melangkah masuk.",
      "Jika ternyata tamu masih ada di dalam kamar, minta maaf dengan sopan dan tanyakan kapan waktu yang nyaman untuk membersihkan kamar."
    ],
    penalty: "Membuka kamar tanpa mengetuk atau mengabaikan tanda DND adalah pelanggaran berat terhadap privasi tamu."
  },
  {
    id: "hk-3",
    category: "karyawan_hk",
    code: "SOP-HK-03",
    title: "SOP Pembersihan Kamar 15 Langkah Berurutan (Cleaning Sequence)",
    severity: "Standar Operasional",
    summary: "Metode pembersihan sistematis dari atas ke bawah dan searah jarum jam untuk efisiensi dan higienitas maksimal.",
    details: [
      "1. Buka pintu selebar mungkin, buka tirai dan jendela untuk ventilasi udara segar.",
      "2. Nyalakan seluruh lampu, cek fungsi AC, TV, remote, stopkontak, dan ceret listrik.",
      "3. Ambil seluruh sampah dari kamar tidur dan kamar mandi, buang ke tempat sampah trolley, ganti kantong plastik baru.",
      "4. Stripping Linen: Lepaskan sarung bantal, sprei, dan duvet kotor. JANGAN PERNAH meletakkan linen di lantai; langsung masukkan ke kantong linen kotor trolley.",
      "5. Periksa sela kasur, bawah bantal, dan laci untuk mencari barang tamu yang tertinggal (Lost & Found).",
      "6. Making Bed (Merapikan Tempat Tidur): Pasang bed pad, fitted sheet dengan sudut mitered 45 derajat kencang tanpa kerutan, pasang duvet cover dan sarung bantal dengan rapi.",
      "7. Aplikasikan cairan pembersih (toilet bowl cleaner) ke bagian dalam kloset dan diamkan agar kuman mati.",
      "8. Dusting (Mengelap Debu): Lap perabot kamar tidur secara searah jarum jam (clockwise) dari bagian atas ke bawah menggunakan kain mikrofiber lembap.",
      "9. Cuci dan gosok kamar mandi: Cuci gelas kamar mandi, gosok wastafel, dinding shower, kaca cermin hingga bening tanpa bekas jari/air.",
      "10. Sikat toilet bowl luar dan dalam menggunakan sikat khusus toilet, bilas bersih, dan lap dudukan kloset dengan desinfektan.",
      "11. Keringkan seluruh lantai kamar mandi hingga kesat dan pasang bath mat bersih.",
      "12. Replenish Amenities: Lengkapi handuk mandi baru, handuk tangan, sabun, sampo, sikat gigi, sanitary bag, dan segel tisu toilet lipatan segitiga.",
      "13. Isi ulang air mineral botol baru, teh, kopi, gula, dan rapikan cangkir di nampan minibar.",
      "14. Vacuum karpet atau sapu dan pel lantai kamar tidur dengan cairan pembersih wangi mundur ke arah pintu keluar.",
      "15. Inspeksi akhir: Semprotkan pengharum ruangan aroma khas hotel, matikan lampu, tutup pintu rapat, dan ubah status kamar di PMS PRO menjadi 'Clean / Inspected'."
    ],
    penalty: "Inspeksi harian oleh Supervisor. Kamar yang tidak lulus standar wajib diulang pembersihannya."
  },
  {
    id: "hk-4",
    category: "karyawan_hk",
    code: "SOP-HK-04",
    title: "SOP Penanganan Barang Tertinggal Tamu (Lost and Found)",
    severity: "Wajib",
    summary: "Integritas tinggi dalam menangani dan mencatat setiap barang milik tamu yang tertinggal di kamar.",
    details: [
      "Setiap staf housekeeping yang menemukan barang tamu tertinggal WAJIB langsung mengamankan barang tersebut dan tidak boleh disimpan untuk kepentingan pribadi.",
      "Laporkan temuan seketika ke Supervisor Housekeeping dan Front Office via WorkChat / HT.",
      "Catat di buku register Lost & Found: Tanggal, jam, nomor kamar, lokasi persis penemuan (misal: di bawah bantal), deskripsi lengkap barang, dan nama staf penemu.",
      "Bungkus barang dalam plastik ziplock transparan bertuliskan Nomor Registrasi Lost & Found.",
      "Serahkan barang berharga (perhiasan, dompet, uang tunai, laptop, kamera, paspor) ke lemari besi terkunci Duty Manager di Front Office.",
      "Staf FO akan segera menghubungi tamu melalui nomor WhatsApp / telepon yang terdaftar pada sistem PMS."
    ],
    penalty: "Penggelapan atau keterlambatan pelaporan barang temuan dikenakan sanksi Pemutusan Hubungan Kerja (PHK) dan dilaporkan ke kepolisian."
  },
  {
    id: "hk-5",
    category: "karyawan_hk",
    code: "SOP-HK-05",
    title: "SOP Pengelolaan Linen Bersih, Linen Kotor & Pencegahan Kontaminasi",
    severity: "Standar Operasional",
    summary: "Menjaga kualitas serat kain dan higienitas seprai serta handuk hotel.",
    details: [
      "Pemisahan Ketat: Dilarang mencampur linen kotor dengan linen bersih di atas trolley yang sama tanpa pembatas bersekat.",
      "Penanganan Linen Bernoda Darah / Kimia: Wajib dipisahkan dalam kantong khusus (infectious / stained bag) untuk perlakuan spotting khusus sebelum pencucian massal.",
      "Penyimpanan Linen Bersih: Disusun rapi di lemari linen (linen room) yang kering, berpendingin, dan terbebas dari hama/serangga.",
      "Prinsip FIFO (First In First Out): Gunakan linen yang telah disimpan lebih dahulu untuk meratakan keausan serat kain sprei.",
      "Perhitungan Par Stock: Catat keluar masuk linen setiap pergantian shift untuk mencegah kehilangan inventaris."
    ],
    penalty: "Pemeriksaan berkala audit inventaris linen oleh bagian Keuangan & Housekeeping Supervisor."
  }
];

export const OTHER_STAFF_RULES: RuleItem[] = [
  {
    id: "mnt-1",
    category: "karyawan_security",
    code: "SOP-MNT-01",
    title: "SOP Respon Cepat Teknisi & Standar K3 Maintenance",
    severity: "Wajib",
    summary: "Memperbaiki kendala fasilitas dengan cepat, aman, dan menjaga kebersihan area kerja.",
    details: [
      "Waktu Respon Cepat: Tiket komplain darurat (air mati, kebocoran pipa deras, AC mati total di kamar berpenghuni, listrik trip) wajib direspon dalam waktu maksimal 15 menit.",
      "Tiket perbaikan umum (lampu redup, engsel pintu berderit, TV saluran hilang) wajib ditangani maksimal 2 jam sejak tiket dibuat di PMS.",
      "Keselamatan Kerja (K3): Wajib mematikan saklar utama (MCB) dan memasang tanda 'Pekerjaan Perbaikan' saat menangani kelistrikan.",
      "Saat bekerja di kamar berpenghuni, selalu ketuk pintu, gunakan alas kaki pelindung sepatu, dan bawa alas terpal agar perkakas tidak mengotori lantai.",
      "Setelah selesai bekerja, bersihkan seluruh debu, sisa kabel, dan pastikan fasilitas berfungsi normal sebelum meninggalkan kamar."
    ],
    penalty: "Kelalaian penanganan kerusakan kritis yang menyebabkan komplain pembatalan kamar ditindaklanjuti secara disipliner."
  },
  {
    id: "sec-1",
    category: "karyawan_security",
    code: "SOP-SEC-01",
    title: "SOP Keamanan, Patroli Keliling 24 Jam & Penjagaan Gerbang",
    severity: "Standar Operasional",
    summary: "Menjaga aset fisik properti, ketertiban lingkungan, dan rasa aman bagi seluruh tamu serta penghuni.",
    details: [
      "Petugas keamanan wajib melakukan patroli keliling seluruh area properti setiap 2 (dua) jam sekali, memeriksa pintu darurat, kondisi pagar, panel listrik, dan area parkir.",
      "Pencatatan Tamu Masuk: Catat identitas tamu luar dan plat nomor kendaraan yang masuk ke area kos/hotel dalam Buku Tamu Keamanan.",
      "Jam Malam Gerbang: Pastikan gerbang utama terkunci pada pukul 23:00 WIB. Periksa dengan teliti setiap orang yang keluar masuk pada dini hari.",
      "Pemantauan CCTV: Awasi monitor CCTV secara konsisten, pastikan tidak ada titik buta (blind spots) yang mencurigakan di sekitar lobi dan tangga darurat.",
      "Tanggap Darurat: Jika terjadi insiden darurat (kebakaran, keributan fisik, percobaan pencurian), segera aktifkan prosedur evakuasi dan hubungi aparat keamanan / pemadam kebakaran setempat."
    ],
    penalty: "Tidur saat jam dinas atau meninggalkan pos jaga tanpa pengganti adalah pelanggaran disiplin berat (SP-2)."
  }
];

export const SANCTION_MATRIX = [
  {
    level: "Teguran Lisan & Pembinaan",
    target: "Penghuni / Tamu / Karyawan",
    infractions: [
      "Karyawan terlambat masuk kerja kurang dari 15 menit.",
      "Penghuni lupa mengunci gerbang atau terlambat mengangkat jemuran pakaian.",
      "Kebisingan ringan di luar jam hening.",
      "Karyawan lupa mengenakan nametag atau seragam sedikit kusut."
    ],
    consequence: "Pencatatan di buku pembinaan personal dan konseling dengan atasan langsung."
  },
  {
    level: "Surat Peringatan 1 (SP-1) / Denda Ringan",
    target: "Penghuni / Tamu / Karyawan",
    infractions: [
      "Penghuni menunggak uang sewa lebih dari 3 hari setelah jatuh tempo.",
      "Penghuni membawa alat elektronik berdaya tinggi tanpa melapor ke manajemen.",
      "Tamu hotel merokok di balkon yang bersebelahan dengan jendela kamar non-smoking.",
      "Karyawan tidak menerapkan standar 5S atau lalai menindaklanjuti komplain tamu dalam batas waktu SOP."
    ],
    consequence: "Denda Rp 50.000 - Rp 250.000 bagi penghuni / Surat Peringatan tertulis berlaku 6 bulan bagi staf."
  },
  {
    level: "Surat Peringatan 2 (SP-2) / Denda Berat",
    target: "Penghuni / Tamu / Karyawan",
    infractions: [
      "Tamu merokok di dalam kamar non-smoking (memicu alarm asap).",
      "Penghuni membawa tamu menginap tanpa izin dan membuat keributan di jam hening.",
      "Karyawan tidur saat shift malam atau meninggalkan pos jaga tanpa izin.",
      "Kerusakan fasilitas kamar akibat kelalaian (sprei terbakar, cermin pecah)."
    ],
    consequence: "Denda pembersihan Rp 1.000.000 (hotel) / pemotongan deposit sewa / SP-2 dan pemotongan insentif kinerja karyawan."
  },
  {
    level: "Pemutusan Sewa / PHK & Pelaporan Hukum",
    target: "Penghuni / Tamu / Karyawan",
    infractions: [
      "Membawa, mengonsumsi, atau mengedarkan NARKOTIKA & MIRAS di area properti.",
      "Melakukan tindakan asusila, prostitusi, perjudian, atau kekerasan fisik.",
      "Karyawan menggelapkan uang pembayaran sewa tamu atau mencuri barang inventaris hotel / Lost & Found.",
      "Membawa senjata api atau senjata tajam berbahaya."
    ],
    consequence: "PEMUTUSAN KONTRAK SEWA SEKETIKA tanpa pengembalian uang sewa & deposit / PHK TIDAK DENGAN HORMAT bagi karyawan dan penyerahan langsung ke KEPOLISIAN RI."
  }
];
