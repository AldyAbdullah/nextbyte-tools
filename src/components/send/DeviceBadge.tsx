'use client';

import React from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { DeviceInfo } from '@/types/nextbyteSend';

interface DeviceBadgeProps {
  device?: DeviceInfo;
  className?: string;
}

export function DeviceBadge({ device, className = '' }: DeviceBadgeProps) {
  if (!device) return null;

  const Icon =
    device.deviceType === 'mobile'
      ? Smartphone
      : device.deviceType === 'tablet'
      ? Tablet
      : Monitor;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 ${className}`}
    >
      <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
      <span>{device.os}</span>
      <span className="text-slate-400 dark:text-slate-500">•</span>
      <span className="text-slate-500 dark:text-slate-400">{device.browser}</span>
    </div>
  );
}
