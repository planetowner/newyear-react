import React, { useCallback, useMemo, useState } from 'react';
import type { PopupOption, Popup } from '../values/models';
import { PopupContext, type PopupState, type PopupContextValue, type LinkPopupData } from './popupContext';

export type { LinkPopupData };

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PopupState>({ type: 'none' });

  const close = useCallback(() => setState({ type: 'none' }), []);

  const open = useCallback(
    <TData,>(type: Exclude<Popup, 'none'>, content?: string, option?: PopupOption<TData>) => {
      setState({ type, content, option: option as PopupOption<unknown> | undefined });
    },
    []
  );

  const alert = useCallback(
    (content: string, option?: PopupOption<unknown>) => open('alert', content, option),
    [open]
  );

  const confirm = useCallback(
    (content: string, option?: PopupOption<unknown>) => open('confirm', content, option),
    [open]
  );

  const link = useCallback(
    (data: LinkPopupData, option?: Omit<PopupOption<LinkPopupData>, 'data'>) => {
      open<LinkPopupData>('link', undefined, { ...(option ?? {}), data });
    },
    [open]
  );

  const value = useMemo<PopupContextValue>(
    () => ({ state, open, alert, confirm, link, close }),
    [state, open, alert, confirm, link, close]
  );

  return <PopupContext.Provider value={value}>{children}</PopupContext.Provider>;
}
