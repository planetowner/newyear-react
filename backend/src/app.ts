process.env.NODE_ENV =
  process.env.NODE_ENV &&
  process.env.NODE_ENV.trim().toLowerCase() === "production"
    ? "production"
    : "development";

import express from "express";
import cors from "cors";
import { DateTime } from "luxon";
import { MongoClient, ObjectId } from "mongodb";
import type { postCardReq } from "../types/app";

if (process.env.NODE_ENV === "development") {
  // 로컬에서만 .env 로드 (Cloudtype는 환경변수로 주입)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config();
}

const server = express();
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

/**
 * CORS
 * - Cloudtype 배포 시: frontend 도메인을 CORS_ORIGINS에 넣어주면 됨
 * - origin이 없는 요청(서버-서버/헬스체크)은 허용
 */
const corsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // non-browser or health checks
    if (corsOrigins.length === 0) return callback(null, true); // fallback (원하면 막아도 됨)
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not Allowed Origin!"));
  },
};

server.use(cors(corsOptions));

const port = Number(process.env.PORT ?? 3000);

// 새해 기준(뉴욕 시간)
const firstDayOf2026 = DateTime.fromISO("2026-01-01T00:00:00", {
  zone: "America/New_York",
});

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getMongo() {
  const MONGODB_URL = requireEnv("MONGODB_URI");
  const dbName = requireEnv("MONGODB_DATABASE");
  const colName = requireEnv("MONGODB_COLLECTION_CARDS");

  const client = new MongoClient(MONGODB_URL);
  const db = client.db(dbName);
  const collectionCard = db.collection(colName);

  return { client, collectionCard };
}

async function postCard(cardData: postCardReq) {
  const { client, collectionCard } = getMongo();
  const local = DateTime.local().setZone("America/New_York");
  const created_at = local.toFormat("yyyyMMddHHmmss");

  const card = { ...cardData, created_at };

  try {
    await client.connect();
    const result = await collectionCard.insertOne(card);

    return result;
  } finally {
    await client.close();
  }
}

async function getCardById(id: string) {
  const { client, collectionCard } = getMongo();

  try {
    await client.connect();
    const card = await collectionCard.findOne({ _id: new ObjectId(id) });
    return card;
  } finally {
    await client.close();
  }
}

// (선택) 헬스체크
server.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/**
 * POST /card
 * body: { shape, text, musicId, sender, receiver }
 * res:  { message: "success", cardId }
 */
server.post("/card", (req, res) => {
  postCard(req.body)
    .then((result) => {
      if (!result) throw new Error("insert failed");
      res.json({ message: "success", cardId: result.insertedId?.toString() });
    })
    .catch((err) => {
      console.error(err);
      res.status(404).json({ errorMessage: "Something goes wrong." });
    });
});

/**
 * GET /card/:id
 * - production + 새해 전이면: message "notyet" + sender/receiver만
 * - 아니면: message "success" + full card
 */
server.get("/card/:id", (req, res) => {
  const { id } = req.params;
  const local = DateTime.local().setZone("America/New_York");

  getCardById(id)
    .then((result: any) => {
      if (!result) throw new Error("not found");

      // _id -> cardId로 내려주기 (프론트가 기대하는 키)
      const normalized = {
        ...result,
        cardId: result._id?.toString(),
      };
      delete normalized._id;

      // 새해 전 제한 (Angular backend가 하던 로직 그대로)
      if (process.env.NODE_ENV === "production" && local < firstDayOf2026) {
        res.json({
          message: "notyet",
          result: {
            sender: normalized.sender,
            receiver: normalized.receiver,
          },
        });
        return;
      }

      res.json({ message: "success", result: normalized });
    })
    .catch((err) => {
      console.error(err);
      res.status(404).json({ errorMessage: "There is no card." });
    });
});

server.listen(port, () => {
  console.log(`the server is running at port ${port}`);
});
