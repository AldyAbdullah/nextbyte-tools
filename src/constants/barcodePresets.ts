import { BarcodeConfig, BarcodeFormat, BarcodeFormatMeta } from '@/types/barcode';

export const DEFAULT_BARCODE_CONFIG: BarcodeConfig = {
  value: 'NB-TOOL-2026',
  format: 'CODE128',
  lineColor: '#0f172a',
  background: '#ffffff',
  width: 2,
  height: 80,
  displayValue: true,
  font: 'monospace',
  fontSize: 16,
  fontOptions: 'bold',
  textAlign: 'center',
  textPosition: 'bottom',
  textMargin: 6,
  margin: 16,
  flat: false,
};

export const BARCODE_FORMATS: BarcodeFormatMeta[] = [
  {
    format: 'CODE128',
    name: 'Code 128 (Universal)',
    category: 'Universal',
    description: 'Format paling serbaguna di dunia. Mendukung seluruh karakter huruf kapital, huruf kecil, angka, dan simbol.',
    defaultSample: 'NB-TOOL-2026',
    patternNotice: 'Mendukung semua karakter alfanumerik dan simbol.',
    validate: (val) => {
      if (!val || val.trim().length === 0) return { isValid: false, error: 'Konten barcode tidak boleh kosong.' };
      return { isValid: true };
    },
  },
  {
    format: 'EAN13',
    name: 'EAN-13 (Retail & Produk)',
    category: 'Retail',
    description: 'Standar barcode kemasan produk komersial di Indonesia dan internasional. Harus berupa 12 atau 13 angka.',
    defaultSample: '8991234567891',
    patternNotice: 'Wajib 12 atau 13 digit angka (0-9). Digit ke-13 adalah checksum otomatis.',
    validate: (val) => {
      const clean = val.trim();
      if (!/^\d{12,13}$/.test(clean)) {
        return { isValid: false, error: 'EAN-13 harus berupa 12 atau 13 digit angka murni.' };
      }
      return { isValid: true };
    },
  },
  {
    format: 'EAN8',
    name: 'EAN-8 (Produk Kemasan Kecil)',
    category: 'Retail',
    description: 'Format pendek untuk produk dengan kemasan kecil seperti permen atau rokok. Terdiri dari 7 atau 8 angka.',
    defaultSample: '96385074',
    patternNotice: 'Wajib 7 atau 8 digit angka.',
    validate: (val) => {
      const clean = val.trim();
      if (!/^\d{7,8}$/.test(clean)) {
        return { isValid: false, error: 'EAN-8 harus berupa 7 atau 8 digit angka murni.' };
      }
      return { isValid: true };
    },
  },
  {
    format: 'UPC',
    name: 'UPC-A (Standar Pasar Amerika)',
    category: 'Retail',
    description: 'Standar barcode produk retail di Amerika Serikat & Kanada. Memerlukan 11 atau 12 digit angka.',
    defaultSample: '012345678905',
    patternNotice: 'Wajib 11 atau 12 digit angka.',
    validate: (val) => {
      const clean = val.trim();
      if (!/^\d{11,12}$/.test(clean)) {
        return { isValid: false, error: 'UPC-A harus berupa 11 atau 12 digit angka murni.' };
      }
      return { isValid: true };
    },
  },
  {
    format: 'CODE39',
    name: 'Code 39 (Industri & Aset)',
    category: 'Logistik & Industri',
    description: 'Banyak digunakan untuk nomor seri inventaris, aset kantor, dan kartu tanda pengenal (ID Card).',
    defaultSample: 'ASSET-2026',
    patternNotice: 'Mendukung huruf kapital (A-Z), angka (0-9), serta simbol - . $ / + % [spasi].',
    validate: (val) => {
      const clean = val.trim().toUpperCase();
      if (!clean) return { isValid: false, error: 'Isi barcode tidak boleh kosong.' };
      if (!/^[0-9A-Z\-\.\ \$\/\+\%]+$/.test(clean)) {
        return { isValid: false, error: 'Code 39 hanya mendukung huruf kapital, angka, dan simbol (- . $ / + % spasi).' };
      }
      return { isValid: true };
    },
  },
  {
    format: 'ITF14',
    name: 'ITF-14 (Karton & Dus Kemasan)',
    category: 'Logistik & Industri',
    description: 'Format barcode untuk dus luar atau master carton logistik pengiriman barang.',
    defaultSample: '10012345678902',
    patternNotice: 'Wajib berupa 13 atau 14 digit angka.',
    validate: (val) => {
      const clean = val.trim();
      if (!/^\d{13,14}$/.test(clean)) {
        return { isValid: false, error: 'ITF-14 harus berupa 13 atau 14 digit angka murni.' };
      }
      return { isValid: true };
    },
  },
  {
    format: 'ITF',
    name: 'ITF (Interleaved 2 of 5)',
    category: 'Logistik & Industri',
    description: 'Barcode dengan kepadatan tinggi untuk angka biner genap di bidang transportasi & gudang.',
    defaultSample: '123456',
    patternNotice: 'Hanya angka, dengan jumlah digit GENAP (contoh: 2, 4, 6, 8 digit).',
    validate: (val) => {
      const clean = val.trim();
      if (!/^\d+$/.test(clean) || clean.length % 2 !== 0) {
        return { isValid: false, error: 'ITF harus berupa angka murni dengan jumlah digit GENAP.' };
      }
      return { isValid: true };
    },
  },
  {
    format: 'codabar',
    name: 'Codabar (Perpustakaan & Resi)',
    category: 'Spesial',
    description: 'Digunakan oleh sistem perpustakaan, kartu peminjaman buku, dan label resi ekspedisi.',
    defaultSample: 'A12345678B',
    patternNotice: 'Karakter angka (0-9) dengan karakter pembuka & penutup A, B, C, atau D.',
    validate: (val) => {
      const clean = val.trim().toUpperCase();
      if (!/^[A-D][0-9\-\$\:\/\.\+]+[A-D]$/.test(clean)) {
        return { isValid: false, error: 'Codabar harus diawali dan diakhiri dengan huruf A, B, C, atau D.' };
      }
      return { isValid: true };
    },
  },
];

export const BARCODE_PRESET_TEMPLATES = [
  {
    title: 'SKU Produk Toko (EAN-13)',
    format: 'EAN13' as BarcodeFormat,
    value: '8999908123456',
    desc: 'Standar ritel barcode GS1 Indonesia & minimarket',
  },
  {
    title: 'Nomor Resi / Ekspedisi (Code 128)',
    format: 'CODE128' as BarcodeFormat,
    value: 'NXT-EXP-8921849',
    desc: 'Untuk paket kurir, pelacakan, dan nota',
  },
  {
    title: 'Inventaris Aset Kantor (Code 39)',
    format: 'CODE39' as BarcodeFormat,
    value: 'INV-LAPTOP-042',
    desc: 'Stiker label nomor aset & peralatan kantor',
  },
  {
    title: 'Master Box / Dus Karton (ITF-14)',
    format: 'ITF14' as BarcodeFormat,
    value: '18991234567891',
    desc: 'Gudang distribusi dan kemasan sekunder grosir',
  },
];

export const BARCODE_COLOR_PALETTES = [
  { name: 'Klasik Hitam', line: '#0f172a', bg: '#ffffff' },
  { name: 'Navy Modern', line: '#1e3a8a', bg: '#f8fafc' },
  { name: 'Forest Emerald', line: '#064e3b', bg: '#f0fdf4' },
  { name: 'Crimson Wine', line: '#881337', bg: '#fff1f2' },
  { name: 'Dark Mode Invert', line: '#f8fafc', bg: '#090d16' },
];
