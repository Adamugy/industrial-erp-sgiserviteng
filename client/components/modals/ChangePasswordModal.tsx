import React, { useEffect, useRef, useState } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '../../../connectors/api/client';

const inputClass = 'w-full h-12 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-control px-4 text-sm text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors';
const labelClass = 'block text-2xs font-black text-slate-500 uppercase tracking-widest mb-2';

const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (next !== confirm) return setError('A confirmação não coincide com a nova palavra-passe.');
    setSaving(true);
    try {
      await api.changePassword(current, next);
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Não foi possível alterar a palavra-passe.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="cp-title" className="w-full max-w-md bg-white rounded-panel shadow-overlay overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 id="cp-title" className="text-lg font-bold text-slate-900">Alterar palavra-passe</h2>
          <button type="button" aria-label="Fechar" onClick={onClose} className="w-9 h-9 inline-flex items-center justify-center rounded-control text-slate-400 hover:text-slate-700 hover:bg-slate-50">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {done ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Check size={22} aria-hidden="true" /></div>
            <p role="status" className="text-sm text-slate-700">Palavra-passe alterada. As sessões noutros dispositivos foram terminadas.</p>
            <button type="button" onClick={onClose} className="mt-6 h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-control">Fechar</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label htmlFor="cp-current" className={labelClass}>Palavra-passe atual</label>
              <input ref={first} id="cp-current" type="password" autoComplete="current-password" className={inputClass} value={current} onChange={(e) => setCurrent(e.target.value)} maxLength={128} />
            </div>
            <div>
              <label htmlFor="cp-new" className={labelClass}>Nova palavra-passe</label>
              <input id="cp-new" type="password" autoComplete="new-password" required minLength={10} maxLength={128} aria-describedby="cp-hint" className={inputClass} value={next} onChange={(e) => setNext(e.target.value)} />
              <p id="cp-hint" className="text-2xs text-slate-500 mt-2">Mínimo 10 caracteres, com letras e números.</p>
            </div>
            <div>
              <label htmlFor="cp-confirm" className={labelClass}>Confirmar nova palavra-passe</label>
              <input id="cp-confirm" type="password" autoComplete="new-password" required minLength={10} maxLength={128} className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <div aria-live="polite">{error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-control p-3">{error}</p>}</div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="h-11 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-control">Cancelar</button>
              <button type="submit" disabled={saving} aria-busy={saving} className="h-11 px-5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-control disabled:opacity-50">
                {saving ? 'A guardar…' : 'Alterar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
