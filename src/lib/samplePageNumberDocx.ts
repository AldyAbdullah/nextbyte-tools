import JSZip from 'jszip';

/**
 * Generate a complete multi-section sample DOCX document for testing page numbering:
 * - Page 1: Halaman Sampul (Cover)
 * - Page 2: Kata Pengantar
 * - Page 3: Daftar Isi
 * - [Section Break: Next Page]
 * - Page 4: Bab I Pendahuluan
 * - [Section Break: Next Page Landscape]
 * - Page 5: Tabel Data Analisis (Landscape)
 * - [Section Break: Next Page Portrait]
 * - Page 6: Bab II Penutup
 */
export async function createSamplePageNumberDocx(): Promise<Blob> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // 3. word/_rels/document.xml.rels
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`
  );

  // 4. word/document.xml
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <!-- ================= HALAMAN 1: SAMPUL (COVER) ================= -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="1200" w:after="240"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="1E3A8A"/></w:rPr><w:t>PROPOSAL TUGAS AKHIR &amp; SKRIPSI</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="800"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="26"/><w:color w:val="475569"/></w:rPr><w:t>Sistem Otomatisasi Dokumen Digital Berbasis OpenXML</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="1600" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>Disusun Oleh:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="1600"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>Ahmad Pratama (NIM: 2026100123)</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="1200"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="0F172A"/></w:rPr><w:t>PROGRAM STUDI TEKNIK INFORMATIKA</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/><w:color w:val="64748B"/></w:rPr><w:t>TAHUN AKADEMIK 2026</w:t></w:r>
    </w:p>
    <!-- Page Break to Page 2 -->
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>

    <!-- ================= HALAMAN 2: KATA PENGANTAR ================= -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="400" w:after="400"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>KATA PENGANTAR</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="200"/><w:ind w:firstLine="720"/></w:pPr>
      <w:r><w:t>Puji dan syukur penulis panjatkan ke hadirat Tuhan Yang Maha Esa atas segala rahmat dan karunia-Nya sehingga dokumen ilmiah ini dapat diselesaikan dengan baik dan tepat waktu.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="200"/><w:ind w:firstLine="720"/></w:pPr>
      <w:r><w:t>Penulis mengucapkan terima kasih yang sebesar-besarnya kepada seluruh dosen pembimbing dan keluarga atas dukungan penuh yang telah diberikan selama masa penyusunan karya ilmiah ini.</w:t></w:r>
    </w:p>
    <!-- Page Break to Page 3 -->
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>

    <!-- ================= HALAMAN 3: DAFTAR ISI ================= -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="400" w:after="400"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>DAFTAR ISI</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="160"/></w:pPr>
      <w:r><w:t>HALAMAN JUDUL / SAMPUL ............................................................................ -</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="160"/></w:pPr>
      <w:r><w:t>KATA PENGANTAR ......................................................................................... ii</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="160"/></w:pPr>
      <w:r><w:t>DAFTAR ISI ...................................................................................................... iii</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="160"/></w:pPr>
      <w:r><w:t>BAB I PENDAHULUAN ..................................................................................... 1</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="160"/></w:pPr>
      <w:r><w:t>BAB II ANALISIS DATA DAN PEMBAHASAN ................................................. 2</w:t></w:r>
    </w:p>

    <!-- ================= SECTION BREAK: AKHIR BAGIAN AWAL ================= -->
    <w:p>
      <w:pPr>
        <w:sectPr>
          <w:type w:val="nextPage"/>
        </w:sectPr>
      </w:pPr>
    </w:p>

    <!-- ================= HALAMAN 4: BAB I PENDAHULUAN ================= -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="400" w:after="400"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>BAB I PENDAHULUAN</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="200"/><w:ind w:firstLine="720"/></w:pPr>
      <w:r><w:t>1.1 Latar Belakang Masalah</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="200"/><w:ind w:firstLine="720"/></w:pPr>
      <w:r><w:t>Penyusunan dokumen akademik sering kali terhambat oleh masalah penomoran halaman yang rumit di Microsoft Word. Bagian sampul tidak boleh memiliki nomor, bagian awal harus bernomor Romawi kecil (i, ii, iii), sedangkan bab isi harus mulai dari angka Arab 1.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="200"/><w:ind w:firstLine="720"/></w:pPr>
      <w:r><w:t>Dengan menggunakan NextByte Word Page Number, pemisahan format penomoran antar section ini dapat diselesaikan secara otomatis dalam hitungan detik.</w:t></w:r>
    </w:p>

    <!-- ================= SECTION BREAK: LANDSCAPE ================= -->
    <w:p>
      <w:pPr>
        <w:sectPr>
          <w:type w:val="nextPage"/>
          <w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
        </w:sectPr>
      </w:pPr>
    </w:p>

    <!-- ================= HALAMAN 5: TABEL LANDSCAPE ================= -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="240"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>TABEL DATA REKAPITULASI RESPONDEN (LANDSCAPE)</w:t></w:r>
    </w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>No</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Kategori Dokumen</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Format Nomor</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Posisi Nomor</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Halaman Sampul</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Tanpa Nomor (TitlePg)</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Kosong</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Kata Pengantar &amp; Daftar Isi</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Romawi Kecil (i, ii, iii)</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Bawah Tengah (Footer Center)</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>3</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Bab I s.d. Bab Penutup</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Angka Arab (1, 2, 3)</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Bawah Kanan (Footer Right)</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>

    <!-- ================= FINAL SECTION (PORTRAIT) ================= -->
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', docXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}
