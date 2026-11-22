'use client';

import React from 'react';
import { Smartphone } from 'lucide-react';
import { usePwa } from '@/context/PwaContext';

export function PwaFooterButton() {
  const { installApp, isInstalled } = usePwa();

  if (isInstalled) return null;

  return (
    <li>
      <button
        onClick={installApp}
        className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors cursor-pointer text-left"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Install Web App (Android)</span>
      </button>
    </li>
  );
}
