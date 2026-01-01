type Card = "penguin" | "santa" | "tree" | "wreath" | "snowman" | "rudolph";

interface postCardReq {
  shape: Card;
  text: string;
  musicId: string;
  sender: string;
  receiver: string;
}

interface postCardRes {
  message: string;
  cardId: string;
}

interface getCardRes {
  shape: Card;
  text: string;
  musicId: string;
  sender: string;
  receiver: string;
  cardId: string;
  created_at?: string;
}

export { postCardReq, postCardRes, getCardRes };
