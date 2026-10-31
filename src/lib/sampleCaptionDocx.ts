import JSZip from 'jszip';

/**
 * A minimal valid 100x100 PNG buffer (blue square with transparent border)
 * Used as mock image inside sample DOCX for testing image extraction and captioning.
 */
const SAMPLE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAA' +
  'K0lEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAeDMs4AABqZqK7gAAAABJ' +
  'RU5ErkJggg==';

/**
 * Generate a complete sample DOCX document containing:
 * - Cover page
 * - BAB I: 2 images and 1 table
 * - BAB II: 1 image and 1 table
 * For testing caption generation and List of Figures / Tables.
 */
export async function createSampleCaptionDocx(): Promise<Blob> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
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

  // 3. Media files
  const imageBytes = Uint8Array.from(atob(SAMPLE_PNG_BASE64), (c) => c.charCodeAt(0));
  zip.file('word/media/image1.png', imageBytes);
  zip.file('word/media/image2.png', imageBytes);

  // 4. word/_rels/document.xml.rels
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImg1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
  <Relationship Id="rIdImg2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image2.png"/>
</Relationships>`
  );

  // 5. word/document.xml
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    <!-- ================= HALAMAN SAMPUL ================= -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="1200" w:after="240"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="40"/><w:color w:val="1E3A8A"/></w:rPr><w:t>PROPOSAL SKRIPSI &amp; RISET</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="1600"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="24"/><w:color w:val="475569"/></w:rPr><w:t>Pengembangan Sistem Deteksi Otomatis Dokumen Digital</w:t></w:r>
    </w:p>
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>

    <!-- ================= KATA PENGANTAR ================= -->
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>KATA PENGANTAR</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="200" w:after="200"/></w:pPr>
      <w:r><w:t>Puji syukur penulis panjatkan kepada Tuhan Yang Maha Esa atas selesainya naskah proposal ini.</w:t></w:r>
    </w:p>
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>

    <!-- ================= BAB I PENDAHULUAN ================= -->
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:before="400" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="0F172A"/></w:rPr><w:t>BAB I PENDAHULUAN</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Pada bab ini dibahas latar belakang, rumusan masalah, dan tujuan penelitian secara komprehensif.</w:t></w:r>
    </w:p>

    <!-- Gambar 1.1: Diagram Arsitektur -->
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="3600000" cy="2400000"/>
            <wp:docPr id="1" name="Gambar Arsitektur Sistem"/>
            <a:graphic>
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic>
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="image1.png"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rIdImg1"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="3600000" cy="2400000"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>

    <!-- Tabel 1.1: Spesifikasi Kebutuhan Sistem -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>No</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Komponen Perangkat</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Spesifikasi Minimum</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>1</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Processor</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Quad-Core 2.4 GHz</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>2</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Memory RAM</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>8 GB DDR4</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>

    <!-- Gambar 1.2: Diagram Alur Proses -->
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="300"/></w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="3600000" cy="2400000"/>
            <wp:docPr id="2" name="Diagram Alur Algoritma"/>
            <a:graphic>
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic>
                  <pic:nvPicPr>
                    <pic:cNvPr id="1" name="image2.png"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rIdImg2"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="3600000" cy="2400000"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>

    <!-- ================= BAB II METODOLOGI PENELITIAN ================= -->
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:before="400" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="0F172A"/></w:rPr><w:t>BAB II LANDASAN TEORI</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Berikut adalah desain konseptual basis data dan tabel parameter pengujian.</w:t></w:r>
    </w:p>

    <!-- Gambar 2.1: Entity Relationship Diagram -->
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="3600000" cy="2400000"/>
            <wp:docPr id="3" name="Entity Relationship Diagram"/>
            <a:graphic>
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic>
                  <pic:nvPicPr>
                    <pic:cNvPr id="2" name="image1.png"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rIdImg1"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="3600000" cy="2400000"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>

    <!-- Tabel 2.1: Parameter Pengujian -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Parameter</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Nilai Acuan</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Throughput</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>&gt; 100 req/sec</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Latency</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>&lt; 50 ms</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>

    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', docXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
}
