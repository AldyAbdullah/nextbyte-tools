import JSZip from 'jszip';
import * as XLSX from 'xlsx';

/**
 * Generate a clean sample DOCX template with text placeholders, conditionals, table, and photo tag
 */
export async function createSampleDocxTemplate(): Promise<Blob> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="png" ContentType="image/png"/>
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
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    <!-- Kop / Judul Surat -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="36"/>
          <w:color w:val="1E3A8A"/>
        </w:rPr>
        <w:t>PT NEXTBYTE DIGITAL NUSANTARA</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:sz w:val="20"/>
          <w:color w:val="64748B"/>
        </w:rPr>
        <w:t>Jl. Digital Inovasi No. 88, Makassar - Website: nextbyte.biz.id</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pBdr>
          <w:bottom w:val="single" w:sz="12" w:space="4" w:color="0F172A"/>
        </w:pBdr>
      </w:pPr>
    </w:p>

    <!-- Nomor & Tanggal Surat -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:t xml:space="preserve">Nomor Surat : </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>{{nomor_surat}}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:spacing w:after="240"/>
      </w:pPr>
      <w:r>
        <w:t xml:space="preserve">Tanggal     : {{tanggal}}</w:t>
      </w:r>
    </w:p>

    <!-- Penerima -->
    <w:p>
      <w:r>
        <w:t xml:space="preserve">Kepada Yth. Bapak/Ibu:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="26"/>
        </w:rPr>
        <w:t>{{nama}}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Jabatan: {{jabatan}}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Alamat : {{alamat}}</w:t>
      </w:r>
    </w:p>

    <!-- Isi Surat -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="160"/>
      </w:pPr>
      <w:r>
        <w:t>Dengan hormat,</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:spacing w:after="160"/>
      </w:pPr>
      <w:r>
        <w:t xml:space="preserve">Berdasarkan hasil evaluasi kerja, Manajemen menyampaikan apresiasi atas dedikasi dan kinerja Saudara/i </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>{{nama}}</w:t>
      </w:r>
      <w:r>
        <w:t xml:space="preserve"> sebagai </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>{{jabatan}}</w:t>
      </w:r>
      <w:r>
        <w:t xml:space="preserve"> di wilayah penempatan {{alamat}}.</w:t>
      </w:r>
    </w:p>

    <!-- Conditional Text: Jika ada bonus -->
    <w:p>
      <w:r>
        <w:t>{{#bonus}}Bonus Apresiasi Kinerja: Rp {{bonus}}{{/bonus}}</w:t>
      </w:r>
    </w:p>

    <!-- Tabel Rincian -->
    <w:tbl>
      <w:tblPr>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Kategori</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Keterangan Dokumen</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
      <w:tr>
        <w:tc>
          <w:p><w:r><w:t>Nama Karyawan</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>{{nama}}</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
      <w:tr>
        <w:tc>
          <w:p><w:r><w:t>Posisi / Divisi</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:p><w:r><w:t>{{jabatan}}</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
      <w:tr>
        <w:tc>
          <w:p><w:r><w:t>Lokasi Tugas</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:p><w:r><w:t>{{alamat}}</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>

    <!-- Pas Foto Penerima -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="240" w:after="80"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="20"/></w:rPr>
        <w:t>Foto Identitas Penerima:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>{{foto}}</w:t>
      </w:r>
    </w:p>

    <!-- Tanda Tangan -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="400" w:after="600"/>
      </w:pPr>
      <w:r>
        <w:t>Hormat kami,</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>Direktur Utama NextByte</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', docXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/**
 * Generate a sample XLSX file with columns: nama, jabatan, alamat, tanggal, nomor_surat, bonus, foto
 */
export function createSampleExcelFile(): Blob {
  const wb = XLSX.utils.book_new();

  const data = [
    {
      nama: 'Andi Pratama',
      jabatan: 'Regional Manager',
      alamat: 'Gorontalo',
      tanggal: '31 Oktober 2026',
      nomor_surat: '001/HRD/X/2026',
      bonus: '7.500.000',
      foto: 'andi.jpg',
    },
    {
      nama: 'Budi Santoso',
      jabatan: 'Field Supervisor',
      alamat: 'Makassar',
      tanggal: '31 Oktober 2026',
      nomor_surat: '002/HRD/X/2026',
      bonus: '5.000.000',
      foto: 'budi.jpg',
    },
    {
      nama: 'Citra Dewi',
      jabatan: 'Senior Operations Staff',
      alamat: 'Palu',
      tanggal: '31 Oktober 2026',
      nomor_surat: '003/HRD/X/2026',
      bonus: '',
      foto: 'citra.jpg',
    },
    {
      nama: 'Dewi Lestari',
      jabatan: 'Account Executive',
      alamat: 'Manado',
      tanggal: '31 Oktober 2026',
      nomor_surat: '004/HRD/X/2026',
      bonus: '4.200.000',
      foto: 'dewi.jpg',
    },
    {
      nama: 'Eko Wahyudi',
      jabatan: 'Technical Lead',
      alamat: 'Kendari',
      tanggal: '31 Oktober 2026',
      nomor_surat: '005/HRD/X/2026',
      bonus: '6.000.000',
      foto: 'eko.jpg',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 20 }, // nama
    { wch: 25 }, // jabatan
    { wch: 18 }, // alamat
    { wch: 18 }, // tanggal
    { wch: 20 }, // nomor_surat
    { wch: 16 }, // bonus
    { wch: 16 }, // foto
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Penerima');

  const arrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
