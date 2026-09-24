import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal, Smartphone, Monitor } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  isDeviceMode: boolean;
  onToggleDeviceMode: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  isDeviceMode,
  onToggleDeviceMode
}) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!isDeviceMode) {
    return (
      <div className="min-h-screen w-full bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col">
        {/* Top switch bar */}
        <div className="flex h-10 w-full items-center justify-between border-b border-zinc-200/80 bg-white/80 px-4 text-xs dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex items-center gap-2 font-medium text-zinc-500">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Mon Budget</span>
            <span>•</span>
            <span>Vue Plein Écran Adaptative</span>
          </div>
          <button
            onClick={onToggleDeviceMode}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
            <span>Passer en Mode Smartphone Android</span>
          </button>
        </div>
        <main className="mx-auto flex-1 w-full max-w-4xl">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-zinc-900 p-2 sm:p-6 flex flex-col items-center justify-center">
      {/* Top switch bar outside phone */}
      <div className="mb-4 flex w-full max-w-md items-center justify-between text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-400">Mon Budget</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400">Émulateur Android M3</span>
        </div>
        <button
          onClick={onToggleDeviceMode}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
        >
          <Monitor className="h-3.5 w-3.5 text-emerald-400" />
          <span>Vue Plein Écran</span>
        </button>
      </div>

      {/* Android Device Shell (Pixel style) */}
      <div className="relative flex h-[860px] w-full max-w-[420px] flex-col overflow-hidden rounded-[44px] border-[10px] border-zinc-800 bg-white shadow-2xl ring-1 ring-white/10 dark:bg-zinc-900">
        {/* Speaker / Camera punch hole */}
        <div className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full bg-zinc-950 ring-2 ring-zinc-800" />
        </div>

        {/* Android Status Bar */}
        <div className="relative z-40 flex h-9 w-full items-center justify-between px-6 text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 select-none">
          <span>{time || '12:00'}</span>
          <div className="flex items-center gap-2">
            <Signal className="h-3.5 w-3.5" />
            <Wifi className="h-3.5 w-3.5" />
            <div className="flex items-center gap-1">
              <span className="text-[10px]">98%</span>
              <BatteryMedium className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          {children}
        </div>

        {/* Android Navigation Bar gesture pill */}
        <div className="flex h-5 w-full items-center justify-center bg-white dark:bg-zinc-900 select-none">
          <div className="h-1 w-32 rounded-full bg-zinc-400 dark:bg-zinc-600" />
        </div>
      </div>
    </div>
  );
};
