import { useCallback, useEffect, useMemo, useState } from "react";
import { usePopup } from "./usePopup";
import type { LinkPopupData } from "./popupContext";
import "./Popup.scss";

type KakaoLike = {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Link: {
    // scrap은 SPA/OG 환경에서 실패하는 경우가 많아서 기본 템플릿 공유(sendDefault)로 전환
    sendScrap?: (opt: unknown) => void;
    sendDefault: (opt: unknown) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoLike;
  }
}

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;
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
      // 이미 달려있는 script가 "load"를 이미 끝냈을 수도 있음 → readyState 체크
      // (브라우저별로 다르니, 그냥 resolve 시도 한번)
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error(`Failed to load ${src}`)),
      { once: true }
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
  const [wechatQrOpen, setWechatQrOpen] = useState(false);
  const [wechatQrDataUrl, setWechatQrDataUrl] = useState<string | null>(null);

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

  // ✅ 공유 URL은 "프론트 도메인 + /card/{id}"가 정답
  const shareUrl = useMemo(() => {
    if (!linkData?.cardId) return "";
    return `${window.location.origin}/card/${linkData.cardId}`;
  }, [linkData]);

  useEffect(() => {
    if (type === "link") {
      setClipboardCopied(false);
      setWechatQrOpen(false);
      setWechatQrDataUrl(null);
    }
  }, [type, shareUrl]);

  const runFn = useCallback((fn?: () => unknown) => {
    try {
      fn?.();
      // eslint-disable-next-line no-empty
    } catch {}
  }, []);

  const onConfirm = useCallback(() => {
    if (type === "none") return;
    runFn(option?.confirm?.fn);
    close();
  }, [close, option?.confirm?.fn, runFn, type]);

  const onCancel = useCallback(() => {
    if (type === "none") return;
    runFn(option?.cancel?.fn);
    close();
  }, [close, option?.cancel?.fn, runFn, type]);

  const onCopyClipboard = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setClipboardCopied(true);
    } catch {
      setClipboardCopied(false);
    }
  }, [shareUrl]);

  const onOpenWeChatQr = useCallback(async () => {
    setWechatQrOpen(true);
    await onCopyClipboard();
  }, [onCopyClipboard]);

  const onCloseWeChatQr = useCallback(() => {
    setWechatQrOpen(false);
    setWechatQrDataUrl(null);
  }, []);

  const onOpenWeChatWeb = useCallback(() => {
    window.open("https://weixin.qq.com/", "_blank", "noopener,noreferrer");
  }, []);

  useEffect(() => {
    let canceled = false;

    async function run() {
      if (type !== "link") return;
      if (!wechatQrOpen) return;
      if (!shareUrl) return;

      try {
        const mod = await import("qrcode");
        const dataUrl = await mod.toDataURL(shareUrl, {
          margin: 1,
          width: 220,
          errorCorrectionLevel: "M",
        });

        if (!canceled) setWechatQrDataUrl(dataUrl);
      } catch {
        if (!canceled) setWechatQrDataUrl(null);
      }
    }

    run();
    return () => {
      canceled = true;
    };
  }, [shareUrl, type, wechatQrOpen]);

  /**
   * ✅ 카카오 공유: sendScrap 대신 sendDefault 사용
   * - sendScrap은 "페이지 스크랩"이라 OG/크롤링/SPA 404에 취약
   * - sendDefault는 우리가 넣는 link/webUrl로 공유 가능
   */
  const onShareKakao = useCallback(async () => {
    if (!shareUrl || !linkData) return;

    const Kakao = await ensureKakaoReady();
    if (!Kakao) {
      // Kakao SDK가 로딩 안 됐으면 링크 복사라도
      await onCopyClipboard();
      return;
    }

    try {
      Kakao.Link.sendDefault({
        objectType: "feed",
        content: {
          title: `${linkData.sender ?? ""}님의 새해 카드`,
          description: `${
            linkData.receiver ?? ""
          }님께 도착한 새해 카드예요. 눌러서 확인해 주세요!`,
          // ✅ 여기 이미지는 "https://로 접근 가능한" 고정 이미지 추천
          // (없으면 임시로 기본 로고/썸네일 하나 만들어 public에 넣는 게 좋음)
          imageUrl: `${window.location.origin}/og-card.png`,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: "카드 열기",
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      });
    } catch {
      // 카카오 공유가 실패하면 최소한 링크라도 복사
      await onCopyClipboard();
    }
  }, [shareUrl, linkData, onCopyClipboard]);

  if (!isOpen) return null;

  return (
    <>
      {type !== "link" ? (
        <div className={`popup-container ${type}`}>
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

          {wechatQrOpen ? (
            <div className="wechat-qr">
              <div className="qr-image">
                {wechatQrDataUrl ? (
                  <img src={wechatQrDataUrl} alt="WeChat QR" />
                ) : (
                  <span className="font-desc">Generating QR…</span>
                )}
              </div>

              <p className="font-desc qr-desc">
                Open WeChat, scan this QR code, then share the link.
              </p>

              <div className="qr-actions">
                <button
                  onClick={onCopyClipboard}
                  className="qr-back"
                  type="button"
                >
                  Copy link
                </button>

                <button
                  onClick={onOpenWeChatWeb}
                  className="qr-back"
                  type="button"
                >
                  Open WeChat
                </button>
              </div>

              <button
                onClick={onCloseWeChatQr}
                className="qr-back"
                type="button"
              >
                돌아가기
              </button>
            </div>
          ) : (
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

              <button
                onClick={onOpenWeChatQr}
                className="button-share"
                type="button"
              >
                <div className="button-icon wechat" />
                <span>위챗 공유</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div
        className="dimmed"
        onClick={type === "confirm" ? onCancel : close}
        role="button"
        tabIndex={-1}
      />
    </>
  );
}
