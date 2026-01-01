import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { find, get as lodashGet } from "lodash-es";

import { getCard } from "../../api/api";
import type { GetCardRes } from "../../api/models";

import { MUSICS } from "../../values/value";
import type { Music } from "../../values/models";
import { isMobile as _isMobile, newlineToBrHtml } from "../../values/utils";

import { usePopup } from "../../popup/usePopup";
import { CountdownTimer } from "../../components/CountdownTimer/CountdownTimer";
import { CardObject } from "../../components/CardObject/CardObject";
import { TextViewer } from "../../components/TextViewer/TextViewer";
import { YoutubePlayer } from "../../components/YoutubePlayer/YoutubePlayer";

import "./CardViewer.scss";

type CardStatus = "enveloped" | "opening" | "opened";

export default function CardViewer() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const { alert, confirm, link } = usePopup();

  const cardId = lodashGet(params, "id", "") as string;

  const [card, setCard] = useState<GetCardRes | null>(null);
  const [isPreview, setIsPreview] = useState<boolean>(() =>
    location.pathname.includes("preview")
  );
  const [isNewYear, setIsNewYear] = useState<boolean>(false);
  const [isActiveFlip, setIsActiveFlip] = useState<boolean>(false);
  const [cardStatus, setCardStatus] = useState<CardStatus>("enveloped");

  const isMobile = _isMobile();

  const selectedMusic: Music | undefined = useMemo(() => {
    if (!card) return undefined;
    const musicId = Number.parseInt(card.musicId ?? "0", 10);
    return find(MUSICS, ({ id }) => id === musicId);
  }, [card]);

  // 최초 진입 시 데이터 로드 + preview 여부 처리 (Angular constructor 로직 포팅) :contentReference[oaicite:3]{index=3}
  React.useEffect(() => {
    setIsPreview(location.pathname.includes("preview"));

    if (!location.pathname.includes("preview")) {
      alert(
        "1월 13일 이후 카드 조회를 할 수 없어요. \n소중한 편지를 꼭 캡쳐해두시기 바래요!"
      );
    }

    if (!cardId) {
      navigate("/404", { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await getCard(cardId);

        // Angular: res.message === 'success'면 isNewYear=true :contentReference[oaicite:4]{index=4}
        if (res.message === "success") setIsNewYear(true);

        setCard(res.result);
      } catch {
        navigate("/404", { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  const shareCard = () => {
    if (!cardId) return;
    link({
      cardId,
      sender: card?.sender,
      receiver: card?.receiver,
    });
  };

  const tryAgain = () => {
    confirm(
      `이 페이지를 벗어나면 다시 돌아올 수 없으니 ${
        isMobile ? "" : "\n"
      }링크를 기억해주세요.\n새로운 편지를 작성하시겠어요?`,
      {
        confirm: { fn: () => navigate("/") },
        cancel: { text: "취소" },
      }
    );
  };

  const openCard = () => {
    if (!isNewYear) {
      alert("2026년 1월 1일에 열어볼 수 있어요. \n새해 첫날 다시 만나요!");
      return;
    }

    setCardStatus("opening");
    window.setTimeout(() => setCardStatus("opened"), 1000);
  };

  const onToggleFlip = () => setIsActiveFlip((v) => !v);

  if (!card) return null;

  return (
    <div className="card-viewer-page">
      <div className="card-container">
        {/* title */}
        <div
          className={`title font-white ${
            cardStatus !== "opened" ? "font-white" : ""
          }`}
        >
          {cardStatus !== "opened" ? (
            <>
              <h1 className="font-h1-kr">
                {card.sender}님이 {card.receiver}님께 보내는 새해 편지
              </h1>
              <h1 className="font-h1">New year's music & letter</h1>

              {!isNewYear && <CountdownTimer />}
            </>
          ) : (
            <>
              <h1 className="font-h1">Happy New Year!</h1>
              <h1 className="font-h1-kr">새해 복 많이 받으세요!</h1>
            </>
          )}
        </div>

        {/* card area */}
        {cardStatus !== "opened" ? (
          <>
            {cardStatus === "enveloped" && (
              <div className="envelop" onClick={openCard} />
            )}
            {cardStatus === "opening" && (
              <object
                className="envelop-opening"
                onClick={openCard}
                data="/assets/envelop/envelop-motion.svg"
                height="400px"
                width="400px"
              />
            )}
          </>
        ) : (
          <div
            className="preview-container"
            onClick={onToggleFlip}
            role="button"
            tabIndex={-1}
          >
            <div
              className={[
                "flip-card",
                "selected-motion",
                isActiveFlip ? "active-preview" : "",
                card.shape, // ngClass :contentReference[oaicite:5]{index=5}
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <div className="preview">
                    <CardObject cardType={card.shape} />
                  </div>
                </div>

                <div className="flip-card-back">
                  <div className="preview">
                    <CardObject cardType={card.shape} lettering="flipped" />
                    <TextViewer
                      receiver={card.receiver}
                      sender={card.sender}
                      text={card.text}
                      music={selectedMusic}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* buttons + guide text */}
        <div className="button-container-right">
          <button onClick={tryAgain} className="button-default" type="button">
            {isPreview ? "하나 더 만들기" : "나도 카드 만들기"}
          </button>

          {isPreview && (
            <button
              onClick={shareCard}
              className="button-default"
              type="button"
            >
              편지 보내기
            </button>
          )}

          {cardStatus === "opened" && !isActiveFlip ? (
            <p className="font-desc font-white font-desc2">
              카드를 {isMobile ? "탭" : "클릭"}하여
              <br />
              편지와 음악을 확인하세요
            </p>
          ) : (
            <p
              className="font-desc font-white font-desc2"
              dangerouslySetInnerHTML={{
                __html: newlineToBrHtml(
                  isPreview
                    ? "편지 보내기 버튼을 눌러\n받는 분께 공유해주세요!"
                    : isNewYear
                    ? "카드를 탭하여 열어보세요!"
                    : ""
                ),
              }}
            />
          )}
        </div>
      </div>

      {/* player (flip on) */}
      {isActiveFlip && selectedMusic && (
        <>
          <div className="player-ui">
            <div onClick={onToggleFlip} role="button" tabIndex={-1} />
          </div>
          <div id="player" className="playing-motion">
            <YoutubePlayer musicId={selectedMusic.id} />
          </div>
        </>
      )}
    </div>
  );
}
