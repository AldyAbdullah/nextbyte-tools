import { jsPDF } from 'jspdf';
import { BulkGeneratedItem, PdfGridSettings } from '@/types/bulkQr';

/**
 * Generate PDF dokumen A4 dengan tata letak grid rapi untuk seluruh QR Code
 */
export async function generateBulkPdf(
  items: BulkGeneratedItem[],
  settings: PdfGridSettings = {
    itemsPerPage: 6,
    includeName: true,
    includeDescription: false,
    marginMm: 12,
  }
): Promise<void> {
  // Hanya proses item yang sukses digenerate
  const validItems = items.filter((it) => it.success && it.dataUrl);
  if (validItems.length === 0) {
    throw new Error('Tidak ada data QR Code yang valid untuk diekspor ke PDF.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = settings.marginMm || 12;
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2 - 16; // 16mm reserved for header & footer

  // Tentukan jumlah kolom dan baris berdasarkan itemsPerPage
  let cols = 2;
  let rows = 3;

  if (settings.itemsPerPage === 4) {
    cols = 2;
    rows = 2;
  } else if (settings.itemsPerPage === 6) {
    cols = 2;
    rows = 3;
  } else if (settings.itemsPerPage === 9) {
    cols = 3;
    rows = 3;
  } else if (settings.itemsPerPage === 12) {
    cols = 3;
    rows = 4;
  }

  const cellWidth = printableWidth / cols;
  const cellHeight = printableHeight / rows;

  // Ukuran gambar QR di dalam sel (beri ruang untuk padding dan teks label nama)
  const textPadding = settings.includeName ? 10 : 2;
  const qrBoxSize = Math.min(cellWidth - 8, cellHeight - textPadding - 6);

  const totalPages = Math.ceil(validItems.length / settings.itemsPerPage);

  const drawHeaderFooter = (pageIndex: number) => {
    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('NextByte Tools — Bulk QR Code Sheet (A4)', margin, margin - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - margin, margin - 4, { align: 'right' });

    // Thin header line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(margin, margin - 2, pageWidth - margin, margin - 2);

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - margin + 2, pageWidth - margin, pageHeight - margin + 2);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('https://nextbyte.biz.id • Siap potong & scan', margin, pageHeight - margin + 6);
    doc.text(`Halaman ${pageIndex} dari ${totalPages}`, pageWidth - margin, pageHeight - margin + 6, { align: 'right' });
  };

  validItems.forEach((item, index) => {
    const pageIndex = Math.floor(index / settings.itemsPerPage) + 1;
    const itemIndexOnPage = index % settings.itemsPerPage;

    if (itemIndexOnPage === 0) {
      if (index > 0) doc.addPage();
      drawHeaderFooter(pageIndex);
    }

    const colIndex = itemIndexOnPage % cols;
    const rowIndex = Math.floor(itemIndexOnPage / cols);

    const cellX = margin + colIndex * cellWidth;
    const cellY = margin + 4 + rowIndex * cellHeight;

    // Kotak panduan potong / garis tepi lembut
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(cellX + 2, cellY + 2, cellWidth - 4, cellHeight - 4);
    doc.setLineDashPattern([], 0); // reset line dash

    // Posisi gambar QR di tengah sel
    const qrX = cellX + (cellWidth - qrBoxSize) / 2;
    const qrY = cellY + 4;

    try {
      doc.addImage(item.dataUrl, 'PNG', qrX, qrY, qrBoxSize, qrBoxSize);
    } catch (err) {
      console.warn(`Gagal menambahkan gambar ke PDF untuk: ${item.row.name}`, err);
    }

    // Label teks di bawah QR
    if (settings.includeName) {
      const textY = qrY + qrBoxSize + 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(settings.itemsPerPage >= 9 ? 8 : 9);
      doc.setTextColor(15, 23, 42); // slate-900

      // Truncate name if too long
      const maxTextWidth = cellWidth - 6;
      let displayName = item.row.name;
      if (doc.getTextWidth(displayName) > maxTextWidth) {
        while (displayName.length > 3 && doc.getTextWidth(displayName + '...') > maxTextWidth) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '...';
      }
      doc.text(displayName, cellX + cellWidth / 2, textY, { align: 'center' });

      // Deskripsi opsional
      if (settings.includeDescription && item.row.description && settings.itemsPerPage <= 6) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        let desc = item.row.description;
        if (doc.getTextWidth(desc) > maxTextWidth) {
          desc = desc.substring(0, 30) + '...';
        }
        doc.text(desc, cellX + cellWidth / 2, textY + 3.5, { align: 'center' });
      }
    }
  });

  doc.save(`bulk-qr-codes-a4-${Date.now()}.pdf`);
}
