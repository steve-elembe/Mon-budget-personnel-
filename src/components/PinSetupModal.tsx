import React, { useState } from 'react';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  createPinCredentials,
  verifyPinCredentials
} from '../utils/securityUtils';

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasExistingPin: boolean;
  currentPinHash?: string;
  currentPinSalt?: string;
  onSavePin: (hash: string, salt: string) => void;
  onDisablePin: () => void;
}

type Step = 'CURRENT' | 'NEW' | 'CONFIRM';

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  isOpen,
  onClose,
  hasExistingPin,
  currentPinHash,
  currentPinSalt,
  onSavePin,
  onDisablePin
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(hasExistingPin ? 'CURRENT' : 'NEW');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setStep(hasExistingPin ? 'CURRENT' : 'NEW');
    onClose();
  };

  const handleVerifyCurrent = async () => {
    setErrorMsg(null);
    if (currentPin.length !== 4) {
      setErrorMsg('Le code PIN doit comporter 4 chiffres.');
      return;
    }

    if (!currentPinHash || !currentPinSalt) {
      setStep('NEW');
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await verifyPinCredentials(currentPin, currentPinHash, currentPinSalt);
      setIsVerifying(false);
      if (isValid) {
        setStep('NEW');
      } else {
        setErrorMsg('Code PIN actuel incorrect.');
      }
    } catch {
      setIsVerifying(false);
      setErrorMsg('Erreur de validation.');
    }
  };

  const handleConfirmDisable = async () => {
    setErrorMsg(null);
    if (currentPin.length !== 4) {
      setErrorMsg('Veuillez saisir votre code PIN actuel pour le désactiver.');
      return;
    }

    setIsVerifying(true);
    try {
      const isValid =
        !currentPinHash ||
        (await verifyPinCredentials(currentPin, currentPinHash, currentPinSalt || ''));
      setIsVerifying(false);
      if (isValid) {
        onDisablePin();
        setSuccessMsg('Verrouillage par PIN désactivé avec succès.');
        setTimeout(handleClose, 1200);
      } else {
        setErrorMsg('Code PIN actuel incorrect. Impossible de désactiver.');
      }
    } catch {
      setIsVerifying(false);
      setErrorMsg('Erreur lors de la désactivation.');
    }
  };

  const handleSaveNewPin = async () => {
    setErrorMsg(null);
    if (newPin.length !== 4) {
      setErrorMsg('Le nouveau code PIN doit comporter 4 chiffres.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('Les codes PIN ne correspondent pas. Veuillez réessayer.');
      return;
    }

    setIsVerifying(true);
    try {
      const { hash, salt } = await createPinCredentials(newPin);
      setIsVerifying(false);
      onSavePin(hash, salt);
      setSuccessMsg('Code PIN configuré et sécurisé avec succès !');
      setTimeout(handleClose, 1200);
    } catch {
      setIsVerifying(false);
      setErrorMsg('Erreur lors du chiffrement du code PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {hasExistingPin ? 'Modifier le code PIN' : 'Créer un code PIN'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Sécurité & Confidentialité de vos finances
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          {successMsg ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-emerald-600 dark:text-emerald-400 space-y-2">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
              <p className="text-xs font-bold">{successMsg}</p>
            </div>
          ) : (
            <>
              {/* Step 1: Verify Current PIN if existing */}
              {step === 'CURRENT' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    Saisissez votre code PIN actuel à 4 chiffres pour continuer ou désactiver le verrouillage :
                  </p>
                  <div>
                    <input
                      type={showNumbers ? 'text' : 'password'}
                      maxLength={4}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={currentPin}
                      onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • •"
                      className="w-full text-center tracking-[0.6em] text-2xl font-black rounded-2xl border border-zinc-200 bg-zinc-50 py-3 text-zinc-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNumbers(!showNumbers)}
                      className="flex items-center gap-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-[11px]"
                    >
                      {showNumbers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      <span>{showNumbers ? 'Masquer' : 'Afficher'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmDisable}
                      disabled={isVerifying || currentPin.length !== 4}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400 text-[11px] font-bold disabled:opacity-40"
                    >
                      Désactiver le PIN
                    </button>
                  </div>

                  <button
                    onClick={handleVerifyCurrent}
                    disabled={isVerifying || currentPin.length !== 4}
                    className="mt-3 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-40 transition"
                  >
                    {isVerifying ? 'Vérification...' : 'Continuer vers le nouveau PIN'}
                  </button>
                </div>
              )}

              {/* Step 2: New PIN and Confirmation */}
              {step === 'NEW' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                      Nouveau code PIN (4 chiffres)
                    </label>
                    <input
                      type={showNumbers ? 'text' : 'password'}
                      maxLength={4}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • •"
                      className="mt-1 w-full text-center tracking-[0.6em] text-2xl font-black rounded-2xl border border-zinc-200 bg-zinc-50 py-3 text-zinc-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                      Confirmez le nouveau code PIN
                    </label>
                    <input
                      type={showNumbers ? 'text' : 'password'}
                      maxLength={4}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • •"
                      className="mt-1 w-full text-center tracking-[0.6em] text-2xl font-black rounded-2xl border border-zinc-200 bg-zinc-50 py-3 text-zinc-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNumbers(!showNumbers)}
                      className="flex items-center gap-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-[11px]"
                    >
                      {showNumbers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      <span>{showNumbers ? 'Masquer' : 'Afficher'}</span>
                    </button>
                    {hasExistingPin && (
                      <button
                        type="button"
                        onClick={() => setStep('CURRENT')}
                        className="text-zinc-400 hover:text-zinc-600 text-[11px]"
                      >
                        Retour
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleSaveNewPin}
                    disabled={isVerifying || newPin.length !== 4 || confirmPin.length !== 4}
                    className="mt-3 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-40 transition"
                  >
                    {isVerifying ? 'Enregistrement sécurisé...' : 'Enregistrer le code PIN'}
                  </button>
                </div>
              )}
            </>
          )}

          {errorMsg && (
            <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl bg-zinc-50 p-2.5 text-[11px] text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Le PIN est haché via SHA-256 avec sel cryptographique. Il n'est jamais stocké en clair.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
