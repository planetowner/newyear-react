export const Step = {
  Card: "card",
  Music: "music",
  Text: "text",
  Preview: "preview",
} as const;

export type Step = (typeof Step)[keyof typeof Step];

export type Title = Record<
  Step,
  {
    kr: string;
    en: string;
  }
>;

export type Card =
  | "penguin"
  | "santa"
  | "tree"
  | "wreath"
  | "snowman"
  | "rudolph";
export type Popup = "none" | "alert" | "confirm" | "link";

export interface Music {
  id: number;
  name: string;
  artist: string;
  image: string;
  lyrics: string;
  youtubeLink: string;
}

export interface PopupOption<TData = unknown> {
  confirm?: {
    text?: string;
    fn?: () => unknown;
  };
  cancel?: {
    text?: string;
    fn?: () => unknown;
  };
  data?: TData;
}

export interface CardDesignConfig {
  type: Card;
}
