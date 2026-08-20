import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Product } from '../lib/types';

export type ProductSlot = 'test' | 'control';

type SlotState = {
  linkedProduct: Product | null; // set via product search — the only way to fill a slot
  photo: string | null; // data URL — supplementary reference only, OCR isn't implemented
};

type SetupState = {
  test: SlotState;
  control: SlotState;
  startDate: string;
  endDate: string;
  hour: string;
  minute: string;
};

type SetupContextValue = SetupState & {
  setProduct: (slot: ProductSlot, product: Product) => void;
  setPhoto: (slot: ProductSlot, dataUrl: string | null) => void;
  setField: <K extends keyof Omit<SetupState, 'test' | 'control'>>(key: K, value: SetupState[K]) => void;
  reset: () => void;
};

function defaultDates() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 28);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

const emptySlot = (): SlotState => ({ linkedProduct: null, photo: null });

function initialState(): SetupState {
  return {
    test: emptySlot(),
    control: emptySlot(),
    ...defaultDates(),
    hour: '',
    minute: '',
  };
}

const SetupContext = createContext<SetupContextValue | null>(null);

export function SetupProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SetupState>(initialState);

  const setProduct = (slot: ProductSlot, product: Product) =>
    setState((s) => ({ ...s, [slot]: { ...s[slot], linkedProduct: product } }));

  const setPhoto = (slot: ProductSlot, dataUrl: string | null) =>
    setState((s) => ({ ...s, [slot]: { ...s[slot], photo: dataUrl } }));

  const setField: SetupContextValue['setField'] = (key, value) => setState((s) => ({ ...s, [key]: value }));

  const reset = () => setState(initialState());

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
