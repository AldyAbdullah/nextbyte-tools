import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    };
    return config;
  },
  serverExternalPackages: ['pdfjs-dist', 'tesseract.js'],
  outputFileTracingIncludes: {
    '/api/tools/pdf-editor/ocr': [
      './public/tessdata/**/*',
      './src/scripts/tessdata/**/*',
    ],
  },
};

export default nextConfig;
