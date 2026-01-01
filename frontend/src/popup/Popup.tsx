import { useCallback, useMemo, useState } from "react";
import { usePopup } from "./usePopup";
import type { LinkPopupData } from "./popupContext";
import { KAKAO_TEMPLATE_ID } from "../values/value";
import "./Popup.scss";

type KakaoLike = {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Link: { sendScrap: (opt: unknown) => void };
};

declare global {
  interface Window {
    Kakao?: KakaoLike;
  }
}

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;
const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";

function newlineToBrHtml(value: string) {
  return value.replace(/\n/g, "<br/>");
}

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existed = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`
    );
    if (existed) {
      existed.addEventListener("load", () => resolve(), { once: true });
      existed.addEventListener(
        "error",
        () => reject(new Error(`Failed to load ${src}`)),
        {
          once: true,
        }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error(`Failed to load ${src}`)),
      {
        once: true,
      }
    );
    document.head.appendChild(script);
  });
}

async function ensureKakaoReady(): Promise<KakaoLike | null> {
  try {
    if (!KAKAO_JS_KEY) return null;

    if (!window.Kakao) {
      await loadScriptOnce(KAKAO_SDK_URL);
    }
    const Kakao = window.Kakao;
    if (!Kakao) return null;

    if (!Kakao.isInitialized()) {
      Kakao.init(KAKAO_JS_KEY);
    }
    return Kakao;
  } catch {
    return null;
  }
}

export function Popup() {
  const { state, close } = usePopup();
  const [clipboardCopied, setClipboardCopied] = useState(false);

  const isOpen = state.type !== "none";
  const type = state.type;

  const option = type === "none" ? undefined : state.option;
  const content = type === "none" ? undefined : state.content;

  const linkData: LinkPopupData | null = useMemo(() => {
    if (type !== "link") return null;

    const d = option?.data;
    if (!d || typeof d !== "object") return null;

    const maybe = d as Partial<LinkPopupData>;
    if (!maybe.cardId) return null;

    return {
      cardId: maybe.cardId,
      sender: maybe.sender,
      receiver: maybe.receiver,
    };
  }, [type, option]);

  const shareUrl = useMemo(() => {
    if (!linkData?.cardId) return "";
    return `${window.location.origin}/card/${linkData.cardId}`;
  }, [linkData]);

  const kakaoShareOption = useMemo(() => {
    if (!linkData) return null;
    return {
      requestUrl: window.location.origin,
      templateId: KAKAO_TEMPLATE_ID,
      templateArgs: {
        SENDER: linkData.sender ?? "",
        CARD_ID: linkData.cardId,
        RECEIVER: linkData.receiver ?? "",
      },
    };
  }, [linkData]);

  const runFn = useCallback((fn?: () => unknown) => {
    try {
      fn?.();
    } catch {
      // UI 안전성: 삼키고 close만 진행
    }
  }, []);

  const onConfirm = useCallback(() => {
    if (type === "none") return;
    runFn(option?.confirm?.fn);
    close();
  }, [type, option, close, runFn]);

  const onCancel = useCallback(() => {
    if (type === "none") return;
    runFn(option?.cancel?.fn);
    close();
  }, [type, option, close, runFn]);

  const onCopyClipboard = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setClipboardCopied(true);
    } catch {
      setClipboardCopied(false);
    }
  }, [shareUrl]);

  const onShareKakao = useCallback(async () => {
    if (!kakaoShareOption) return;

    const Kakao = await ensureKakaoReady();
    if (!Kakao) return;

    Kakao.Link.sendScrap(kakaoShareOption);
  }, [kakaoShareOption]);

  if (!isOpen) return null;

  return (
    <>
      {type !== "link" ? (
        <div className="popup-container">
          <p
            className="font-desc"
            dangerouslySetInnerHTML={{ __html: newlineToBrHtml(content ?? "") }}
          />
          <div className="button-wrapper">
            {type === "confirm" && (
              <button
                className="cancel-button"
                onClick={onCancel}
                type="button"
              >
                {option?.cancel?.text ?? "취소"}
              </button>
            )}
            <button
              className="confirm-button"
              onClick={onConfirm}
              type="button"
            >
              {option?.confirm?.text ?? "확인"}
            </button>
          </div>
        </div>
      ) : (
        <div className="popup-container link">
          <p className="font-desc">받는 분께 링크를 공유해주세요!</p>

          <div className="button-wrapper">
            <button
              onClick={onCopyClipboard}
              className="button-share"
              type="button"
            >
              <div className="button-icon clipboard" />
              <span>{clipboardCopied ? "복사 완료!" : "링크 복사"}</span>
            </button>

            <button
              onClick={onShareKakao}
              className="button-share"
              type="button"
            >
              <div className="button-icon kakaotalk" />
              <span>카카오톡 공유</span>
            </button>
          </div>
        </div>
      )}

      {/* dimmed 클릭 동작: confirm이면 cancel, 나머지는 close */}
      <div
        className="dimmed"
        onClick={type === "confirm" ? onCancel : close}
        role="button"
        tabIndex={-1}
      />
    </>
  );
}
