import { QrDataContent } from '@/types/qrcode';

/**
 * Memformat input pengguna menjadi payload QR Code standar
 */
export function formatQrPayload(content: QrDataContent): string {
  switch (content.type) {
    case 'url': {
      let url = content.url.trim();
      if (!url) return 'https://nextbyte.biz.id';
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      return url;
    }

    case 'text':
      return content.text || 'NextByte Multi Tools';

    case 'email': {
      const email = content.email.trim();
      if (!email) return 'mailto:info@nextbyte.biz.id';
      const params: string[] = [];
      if (content.emailSubject) {
        params.push(`subject=${encodeURIComponent(content.emailSubject)}`);
      }
      if (content.emailBody) {
        params.push(`body=${encodeURIComponent(content.emailBody)}`);
      }
      const query = params.length > 0 ? `?${params.join('&')}` : '';
      return `mailto:${email}${query}`;
    }

    case 'phone': {
      const phone = content.phoneNumber.replace(/[^\d+]/g, '');
      return phone ? `tel:${phone}` : 'tel:+6281234567890';
    }

    case 'whatsapp': {
      let wa = content.whatsappNumber.replace(/[^\d]/g, '');
      // Format nomor Indonesia jika diawali 08
      if (wa.startsWith('0')) {
        wa = '62' + wa.substring(1);
      }
      const message = content.whatsappMessage.trim();
      const query = message ? `?text=${encodeURIComponent(message)}` : '';
      return `https://wa.me/${wa || '6281234567890'}${query}`;
    }

    case 'wifi': {
      const ssid = escapeWifiString(content.wifiSsid.trim() || 'NextByte-WiFi');
      const auth = content.wifiEncryption || 'WPA';
      const pass = escapeWifiString(content.wifiPassword || '');
      const hidden = content.wifiHidden ? 'H:true;' : '';
      return `WIFI:S:${ssid};T:${auth};P:${pass};${hidden};`;
    }

    case 'sms': {
      const phone = content.smsNumber.replace(/[^\d+]/g, '') || '+6281234567890';
      const msg = content.smsMessage || '';
      return `smsto:${phone}:${msg}`;
    }

    default:
      return 'https://nextbyte.biz.id';
  }
}

function escapeWifiString(str: string): string {
  return str.replace(/([\\;,:"])/g, '\\$1');
}

export function validateQrContent(content: QrDataContent): { isValid: boolean; message?: string } {
  switch (content.type) {
    case 'url':
      if (!content.url.trim()) return { isValid: false, message: 'URL tidak boleh kosong.' };
      return { isValid: true };

    case 'text':
      if (!content.text.trim()) return { isValid: false, message: 'Teks tidak boleh kosong.' };
      return { isValid: true };

    case 'email':
      if (!content.email.trim()) return { isValid: false, message: 'Email penerima wajib diisi.' };
      if (!/\S+@\S+\.\S+/.test(content.email)) {
        return { isValid: false, message: 'Format alamat email belum valid.' };
      }
      return { isValid: true };

    case 'phone':
      if (!content.phoneNumber.trim()) return { isValid: false, message: 'Nomor telepon wajib diisi.' };
      return { isValid: true };

    case 'whatsapp':
      if (!content.whatsappNumber.trim()) return { isValid: false, message: 'Nomor WhatsApp wajib diisi.' };
      return { isValid: true };

    case 'wifi':
      if (!content.wifiSsid.trim()) return { isValid: false, message: 'Nama Wi-Fi (SSID) wajib diisi.' };
      if (content.wifiEncryption !== 'nopass' && !content.wifiPassword.trim()) {
        return { isValid: false, message: 'Password Wi-Fi wajib diisi untuk enkripsi WPA/WEP.' };
      }
      return { isValid: true };

    case 'sms':
      if (!content.smsNumber.trim()) return { isValid: false, message: 'Nomor tujuan SMS wajib diisi.' };
      return { isValid: true };

    default:
      return { isValid: true };
  }
}
