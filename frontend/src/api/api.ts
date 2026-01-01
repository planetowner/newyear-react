import type { GetCardRes, PostCardReq, PostCardRes } from "./models";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

export async function postCard(body: PostCardReq): Promise<PostCardRes> {
  const res = await fetch(`${API_BASE}/card`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw await res
      .json()
      .catch(() => ({ errorMessage: "Something goes wrong." }));
  return res.json();
}

export async function getCard(
  id: string
): Promise<{ message: string; result: GetCardRes }> {
  const res = await fetch(`${API_BASE}/card/${id}`);
  if (!res.ok)
    throw await res.json().catch(() => ({ errorMessage: "There is no card." }));
  return res.json();
}
