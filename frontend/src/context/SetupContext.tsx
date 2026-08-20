import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Product } from '../lib/types';

export type ProductSlot = 'test' | 'control';

type SetupState = {
  testProduct: Product | null;
  controlProduct: Product | null;
  testPhoto: string | null; // data URL, manual-entry fallback for the "촬영하기" flow
  controlPhoto: string | null;
  testManualName: string;
  testManualBrand: string;
  controlManualName: string;
  controlManualBrand: string;
  startDate: string;
  endDate: string;
  hour: string;
  minute: string;
};

type SetupContextValue = SetupState & {
  setProduct: (slot: ProductSlot, product: Product) => void;
  setPhoto: (slot: ProductSlot, dataUrl: string | null) => void;
  setField: <K extends keyof SetupState>(key: K, value: SetupState[K]) => void;
  reset: () => void;
};

function defaultDates() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 28);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

const initialState: SetupState = {
  testProduct: null,
  controlProduct: null,
  testPhoto: null,
  controlPhoto: null,
  testManualName: '',
  testManualBrand: '',
  controlManualName: '',
  controlManualBrand: '',
  ...defaultDates(),
  hour: '',
  minute: '',
};

const SetupContext = createContext<SetupContextValue | null>(null);

export function SetupProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SetupState>(initialState);

  const setProduct = (slot: ProductSlot, product: Product) =>
    setState((s) => ({ ...s, [slot === 'test' ? 'testProduct' : 'controlProduct']: product }));

  const setPhoto = (slot: ProductSlot, dataUrl: string | null) =>
    setState((s) => ({ ...s, [slot === 'test' ? 'testPhoto' : 'controlPhoto']: dataUrl }));

  const setField: SetupContextValue['setField'] = (key, value) => setState((s) => ({ ...s, [key]: value }));

  const reset = () => setState({ ...initialState, ...defaultDates() });

  return (
    <SetupContext.Provider value={{ ...state, setProduct, setPhoto, setField, reset }}>
      {children}
    </SetupContext.Provider>
  );
}

export function useSetup() {
  const ctx = useContext(SetupContext);
  if (!ctx) throw new Error('useSetup must be used within SetupProvider');
  return ctx;
}
