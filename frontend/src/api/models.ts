export type Card =
  | "penguin"
  | "santa"
  | "tree"
  | "wreath"
  | "snowman"
  | "rudolph";

export interface PostCardReq {
  shape: Card;
  text: string;
  musicId: string;
  sender: string;
  receiver: string;
}

export interface PostCardRes {
  message: string;
  cardId: string;
}

export interface GetCardRes {
  shape: Card;
  text: string;
  musicId: string;
  sender: string;
  receiver: string;
  cardId: string;
}
