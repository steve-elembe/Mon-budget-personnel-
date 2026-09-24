import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Fingerprint,
  Delete,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { verifyPinCredentials, triggerBiometricAuthentication } from '../utils/securityUtils';

interface LockScreenProps {
  pinHash?: string;
  pinSalt?: string;
  isBiometricsEnabled: boolean;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  pinHash,
  pinSalt,
  isBiometricsEnabled,
  onUnlock
}) => {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [biometricPrompting, setBiometricPrompting] = useState<boolean>(false);

  // Maximum PIN digits (standard 4 digits)
  const maxDigits = 4;

  const handleDigit = (digit: string) => {
    if (enteredPin.length >= maxDigits || isVerifying) return;
    setErrorMsg(null);
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);

    // Auto verify once 4 digits are entered
    if (nextPin.length === maxDigits) {
      verifyCode(nextPin);
    }
  };

  const handleDelete = () => {
    if (isVerifying) return;
    setErrorMsg(null);
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isVerifying) return;
    setEnteredPin('');
    setErrorMsg(null);
  };

  const verifyCode = async (pinToVerify: string) => {
    if (!pinHash || !pinSalt) {
      // If lock was active but no PIN was configured, let through
      onUnlock();
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await verifyPinCredentials(pinToVerify, pinHash, pinSalt);
      if (isValid) {
        setIsVerifying(false);
        onUnlock();
      } else {
        setIsVerifying(false);
        setErrorMsg('Code PIN incorrect. Veuillez réessayer.');
        setIsShaking(true);
        setTimeout(() => {
          setIsShaking(false);
          setEnteredPin('');
        }, 500);
      }
    } catch (e) {
      setIsVerifying(false);
      setErrorMsg('Erreur de vérification.');
      setEnteredPin('');
    }
  };

  const handleBiometricClick = async () => {
    if (!isBiometricsEnabled) return;
    setBiometricPrompting(true);
    setErrorMsg(null);
    try {
      const result = await triggerBiometricAuthentication();
      setBiometricPrompting(false);
      if (result.success) {
        onUnlock();
      } else {
        setErrorMsg(result.message || 'Authentification biométrique non reconnue.');
      }
    } catch {
      setBiometricPrompting(false);
      setErrorMsg('Erreur biométrique.');
    }
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enteredPin, isVerifying]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-zinc-900/98 px-6 py-10 text-white backdrop-blur-xl select-none">
      {/* Top Brand & Status */}
      <div className="flex flex-col items-center gap-3 pt-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-950/40">
          <Lock className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            Mon Budget
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Application sécurisée • Saisissez votre code PIN
          </p>
        </div>
      </div>

      {/* PIN Dots display */}
      <div className="flex flex-col items-center my-auto">
        <div
          className={`flex items-center gap-4 transition-transform duration-200 ${
            isShaking ? 'translate-x-2' : ''
          }`}
        >
          {Array.from({ length: maxDigits }).map((_, i) => {
            const isFilled = i < enteredPin.length;
            return (
              <div
                key={i}
                className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                  isFilled
                    ? 'border-emerald-400 bg-emerald-400 scale-110 shadow-sm shadow-emerald-400/50'
                    : 'border-zinc-600 bg-zinc-800/80'
                }`}
              />
            );
          })}
        </div>

        {/* Status or Error Message */}
        <div className="h-6 mt-4 text-center">
          {errorMsg ? (
            <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-400 animate-pulse">
              <AlertCircle className="h-3.5 w-3.5" />
              {errorMsg}
            </p>
          ) : isVerifying ? (
            <p className="text-xs text-emerald-400 font-medium animate-pulse">
              Vérification du code...
            </p>
          ) : biometricPrompting ? (
            <p className="text-xs text-emerald-400 font-medium animate-pulse">
              En attente de votre empreinte digitale...
            </p>
          ) : (
            <p className="text-[11px] text-zinc-500">
              Protection par empreinte ou code à 4 chiffres
            </p>
          )}
        </div>
      </div>

      {/* Touch Numeric Keypad */}
      <div className="w-full max-w-xs space-y-3 pb-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              disabled={isVerifying}
              className="flex h-16 w-full items-center justify-center rounded-2xl bg-zinc-800/80 border border-zinc-700/50 text-2xl font-bold text-white shadow-xs transition hover:bg-zinc-700/80 active:scale-95 active:bg-emerald-600/30"
            >
              {digit}
            </button>
          ))}

          {/* Biometrics button (if enabled) */}
          {isBiometricsEnabled ? (
            <button
              onClick={handleBiometricClick}
              disabled={isVerifying || biometricPrompting}
              className="flex h-16 w-full items-center justify-center rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 shadow-xs transition hover:bg-emerald-900/50 active:scale-95"
              title="Déverrouillage biométrique"
            >
              <Fingerprint className="h-7 w-7" />
            </button>
          ) : (
            <div className="h-16 w-full" />
          )}

          {/* 0 digit */}
          <button
            onClick={() => handleDigit('0')}
            disabled={isVerifying}
            className="flex h-16 w-full items-center justify-center rounded-2xl bg-zinc-800/80 border border-zinc-700/50 text-2xl font-bold text-white shadow-xs transition hover:bg-zinc-700/80 active:scale-95 active:bg-emerald-600/30"
          >
            0
          </button>

          {/* Delete backspace button */}
          <button
            onClick={handleDelete}
            disabled={isVerifying || enteredPin.length === 0}
            className="flex h-16 w-full items-center justify-center rounded-2xl bg-zinc-800/50 border border-zinc-700/40 text-zinc-400 transition hover:bg-zinc-700/60 hover:text-white active:scale-95 disabled:opacity-40"
            title="Effacer"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>

        {/* Security badge at bottom */}
        <div className="flex items-center justify-center gap-1.5 pt-2 text-[10px] text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Code chiffré SHA-256 avec sel • Jamais stocké en clair</span>
        </div>
      </div>
    </div>
  );
};
