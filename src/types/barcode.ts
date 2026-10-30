export type BarcodeFormat =
  | 'CODE128'
  | 'EAN13'
  | 'EAN8'
  | 'UPC'
  | 'CODE39'
  | 'ITF14'
  | 'ITF'
  | 'MSI'
  | 'pharmacode'
  | 'codabar';

export interface BarcodeConfig {
  value: string;
  format: BarcodeFormat;
  lineColor: string;
  background: string;
  width: number;       // scale multiplier 1 - 4
  height: number;      // barcode height in px (30 - 180)
  displayValue: boolean;
  font: string;        // 'monospace' | 'sans-serif' | 'serif'
  fontSize: number;    // 12 - 24
  fontOptions: string; // 'bold' | 'italic' | 'bold italic' | ''
  textAlign: 'left' | 'center' | 'right';
  textPosition: 'bottom' | 'top';
  textMargin: number;  // 0 - 20
  margin: number;      // outer padding 0 - 40
  flat: boolean;
}

export interface BarcodeFormatMeta {
  format: BarcodeFormat;
  name: string;
  category: 'Universal' | 'Retail' | 'Logistik & Industri' | 'Spesial';
  description: string;
  defaultSample: string;
  patternNotice: string;
  validate: (val: string) => { isValid: boolean; error?: string };
}
