import { createContext } from "react";
import type { PopupOption, Popup } from "../values/models";

export type LinkPopupData = {
  cardId: string;
  sender?: string;
  receiver?: string;
};

export type PopupState =
  | { type: "none" }
  | {
      type: Exclude<Popup, "none">;
      content?: string;
      option?: PopupOption<unknown>;
    };

export type PopupContextValue = {
  state: PopupState;
  open: <TData = unknown>(
    type: Exclude<Popup, "none">,
    content?: string,
    option?: PopupOption<TData>
  ) => void;
  alert: (content: string, option?: PopupOption<unknown>) => void;
  confirm: (content: string, option?: PopupOption<unknown>) => void;
  link: (
    data: LinkPopupData,
    option?: Omit<PopupOption<LinkPopupData>, "data">
  ) => void;
  close: () => void;
};

export const PopupContext = createContext<PopupContextValue | null>(null);
