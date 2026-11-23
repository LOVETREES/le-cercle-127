import { useEffect, useState } from 'react';
import { readLocalDraft, writeLocalDraft } from './local-draft';

export function useLocalDraft(key: string, fallback = '', revision: string | number | boolean = 0) {
  const identity = `${key}:${String(revision)}`;
  const [state, setState] = useState({ identity: '', text: '', ready: false, error: false });
  useEffect(() => {
    let active = true;
    readLocalDraft(key).then((value) => {
      if (active) setState({ identity, text: value ?? fallback, ready: true, error: false });
    }, () => { if (active) setState({ identity, text: fallback, ready: true, error: true }); });
    return () => { active = false; };
  }, [key, identity, fallback]);
  const set = (text: string) => {
    setState({ identity, text, ready: true, error: false });
    void writeLocalDraft(key, text).catch(() => setState((s) => s.identity === identity ? { ...s, error: true } : s));
  };
  const clear = async (value = '') => {
    await writeLocalDraft(key, null);
    setState((s) => s.identity === identity ? { identity, text: value, ready: true, error: false } : s);
  };
  return { text: state.identity === identity ? state.text : '', ready: state.identity === identity && state.ready, error: state.identity === identity && state.error, set, clear };
}
