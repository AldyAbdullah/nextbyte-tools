import { ToolItem } from '@/types/tools';

export const TOOLS_REGISTRY: ToolItem[] = [
  {
    id: 'qr-code-generator',
    name: 'QR Code Generator',
    slug: 'qr-code-generator',
    description: 'Create highly customizable QR codes with custom shapes, colors, frames, logos, and print-ready high-resolution export.',
    category: 'Utility',
    status: 'available',
    iconName: 'QrCode',
    featured: true,
    badge: 'Popular',
    tags: ['qr', 'generator', 'wifi', 'whatsapp', 'barcode', 'design', 'custom']
  },
  {
    id: 'barcode-generator',
    name: 'Barcode Generator',
    slug: 'barcode-generator',
    description: 'Generate standard industry barcodes (Code 128, EAN-13, UPC, Code 39, ITF-14) in high-resolution PNG, SVG vector, and JPG.',
    category: 'Utility',
    status: 'available',
    iconName: 'Barcode',
    featured: true,
    badge: 'Baru',
    tags: ['barcode', 'code128', 'ean13', 'upc', 'code39', 'retail', 'inventory', 'sku']
  },
  {
    id: 'password-generator',
    name: 'Strong Password Generator',
    slug: 'password-generator',
    description: 'Generate ultra-secure, cryptographically random passwords with custom rules, symbols, and memorability scores.',
    category: 'Security',
    status: 'coming-soon',
    iconName: 'KeyRound',
    featured: true,
    tags: ['security', 'password', 'crypto', 'generator']
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter & Validator',
    slug: 'json-formatter',
    description: 'Beautify, minify, validate, and convert JSON structures with syntax highlighting and tree exploration.',
    category: 'Developer',
    status: 'coming-soon',
    iconName: 'FileCode2',
    featured: true,
    tags: ['developer', 'json', 'formatter', 'validator']
  },
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    slug: 'image-compressor',
    description: 'Compress PNG, JPEG, and WebP images directly in your browser with zero server uploads and zero quality loss.',
    category: 'Media',
    status: 'coming-soon',
    iconName: 'Minimize2',
    featured: true,
    tags: ['image', 'compress', 'optimize', 'media']
  },
  {
    id: 'image-converter',
    name: 'Image Format Converter',
    slug: 'image-converter',
    description: 'Instantly convert between PNG, JPG, WebP, SVG, and ICO formats right inside your browser.',
    category: 'Media',
    status: 'coming-soon',
    iconName: 'Image',
    tags: ['image', 'convert', 'png', 'jpg', 'webp']
  },
  {
    id: 'pdf-tools',
    name: 'PDF Merge & Split',
    slug: 'pdf-tools',
    description: 'Combine multiple PDF files or extract specific pages quickly without uploading documents to external servers.',
    category: 'Utility',
    status: 'coming-soon',
    iconName: 'FileText',
    tags: ['pdf', 'merge', 'split', 'document']
  },
  {
    id: 'url-encoder-decoder',
    name: 'URL Encoder / Decoder',
    slug: 'url-encoder-decoder',
    description: 'Safely encode and decode URL query parameters, escape special characters, and parse URL structures.',
    category: 'Developer',
    status: 'coming-soon',
    iconName: 'Link2',
    tags: ['url', 'encoder', 'decoder', 'developer']
  },
  {
    id: 'base64-converter',
    name: 'Base64 Encoder / Decoder',
    slug: 'base64-converter',
    description: 'Convert text, images, and binary files to Base64 strings and decode Base64 data back to original formats.',
    category: 'Developer',
    status: 'coming-soon',
    iconName: 'Binary',
    tags: ['base64', 'binary', 'encoder', 'developer']
  },
  {
    id: 'text-formatter',
    name: 'Text Formatter & Case Converter',
    slug: 'text-formatter',
    description: 'Transform text to UPPERCASE, lowercase, Title Case, camelCase, kebab-case, snake_case, and remove duplicates.',
    category: 'Text',
    status: 'coming-soon',
    iconName: 'Type',
    tags: ['text', 'case', 'formatter', 'string']
  },
  {
    id: 'word-counter',
    name: 'Word & Character Counter',
    slug: 'word-counter',
    description: 'Real-time text analytics: word count, character count, reading time, speaking time, and keyword density.',
    category: 'Text',
    status: 'coming-soon',
    iconName: 'AlignLeft',
    tags: ['text', 'words', 'counter', 'analytics']
  }
];

export const TOOL_CATEGORIES = ['All', 'Utility', 'Developer', 'Media', 'Security', 'Text'] as const;
