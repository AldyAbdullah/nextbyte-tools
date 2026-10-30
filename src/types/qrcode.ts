export type QrDataType = 'url' | 'text' | 'email' | 'phone' | 'whatsapp' | 'wifi' | 'sms';

export type QrDotType = 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';

export type QrCornerSquareType = 'square' | 'dot' | 'extra-rounded';

export type QrCornerDotType = 'square' | 'dot';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type FrameStyle = 
  | 'none'
  | 'basic-top'
  | 'basic-bottom'
  | 'bubble-top'
  | 'bubble-bottom'
  | 'card-banner'
  | 'minimal-border'
  | 'camera-frame';

export type FrameTextPosition = 'top' | 'bottom';

export type SubTextFontFamily = 'sans' | 'mono' | 'serif' | 'display';

export type SubTextFontWeight = '400' | '500' | '600' | '700';

export type SubTextAlign = 'left' | 'center' | 'right';

export type ExportFormat = 'png' | 'svg' | 'jpg';

export type ExportResolution = 1 | 2 | 4;

export interface QrDataContent {
  type: QrDataType;
  // URL
  url: string;
  // Raw Text
  text: string;
  // Email
  email: string;
  emailSubject: string;
  emailBody: string;
  // Phone
  phoneNumber: string;
  // WhatsApp
  whatsappNumber: string;
  whatsappMessage: string;
  // Wi-Fi
  wifiSsid: string;
  wifiPassword: string;
  wifiEncryption: 'WPA' | 'WEP' | 'nopass';
  wifiHidden: boolean;
  // SMS
  smsNumber: string;
  smsMessage: string;
}

export interface QrDesignConfig {
  dotsType: QrDotType;
  cornersSquareType: QrCornerSquareType;
  cornersDotType: QrCornerDotType;
  errorCorrectionLevel: ErrorCorrectionLevel;
}

export interface QrColorConfig {
  foregroundColor: string;
  backgroundColor: string;
  isBackgroundTransparent: boolean;
  customCorners: boolean;
  cornersSquareColor: string;
  cornersDotColor: string;
}

export interface QrLogoConfig {
  logoDataUrl: string | null;
  logoSize: number; // 0.15 to 0.45
  logoMargin: number; // 0 to 20
  logoBackground: 'transparent' | 'white' | 'circle-white' | 'square-white';
}

export interface QrFrameConfig {
  style: FrameStyle;
  text: string;
  textColor: string;
  frameColor: string;
  backgroundColor: string;
  borderWidth: number;
  padding: number;
  borderRadius: number;
  textPosition: FrameTextPosition;
}

export interface QrSubTextConfig {
  enabled: boolean;
  text: string;
  fontSize: number; // 12 to 36
  color: string;
  fontFamily: SubTextFontFamily;
  fontWeight: SubTextFontWeight;
  align: SubTextAlign;
  spacing: number; // 4 to 40
}

export interface QrExportConfig {
  format: ExportFormat;
  resolution: ExportResolution;
  transparentBackground: boolean;
  fileName: string;
}

export interface CompleteQrConfig {
  content: QrDataContent;
  design: QrDesignConfig;
  colors: QrColorConfig;
  logo: QrLogoConfig;
  frame: QrFrameConfig;
  subText: QrSubTextConfig;
}
