import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { length as strLength, limit as strLimit } from "stringz";
import { find } from "lodash-es";

import { postCard } from "../../api/api";
import type { PostCardReq } from "../../api/models";

import { Step } from "../../values/models";
import type { Music } from "../../values/models";
import { EDITOR_TITLE, MAX_LENGTH, MUSICS } from "../../values/value";
import { focusOnWriting, koreanSuffix } from "../../values/utils";

import { usePopup } from "../../popup/usePopup";
import { CardObject } from "../../components/CardObject/CardObject";
import { TextViewer } from "../../components/TextViewer/TextViewer";
import { YoutubePlayer } from "../../components/YoutubePlayer/YoutubePlayer";

import { FormCardShape } from "./FormCardShape";
import { FormMusicPlaylist } from "./FormMusicPlaylist";

import "./Editor.scss";

type EditorForm = {
  shape: PostCardReq["shape"];
  musicId: string;
  sender: string;
  receiver: string;
  text: string;
};

export default function Editor() {
  const navigate = useNavigate();
  const { alert, confirm } = usePopup();

  const [currentStep, setCurrentStep] = useState<Step>(Step.Card);
  const [isActiveFlip, setIsActiveFlip] = useState(false);

  const [form, setForm] = useState<EditorForm>({
    shape: "penguin",
    musicId: "",
    sender: "",
    receiver: "",
    text: "",
  });

  const flipCardRef = useRef<HTMLDivElement | null>(null);

  const letterMaxLength = MAX_LENGTH;

  const musicIdNumber = useMemo(() => {
    const n = Number.parseInt(form.musicId, 10);
    return Number.isFinite(n) ? n : undefined;
  }, [form.musicId]);

  const selectedMusic: Music | undefined = useMemo(() => {
    if (!musicIdNumber && musicIdNumber !== 0) return undefined;
    return find(MUSICS, ({ id }) => id === musicIdNumber);
  }, [musicIdNumber]);

  const currentLetterLength = useMemo(
    () => strLength(form.text ?? ""),
    [form.text]
  );

  // Android 입력 포커스 workaround (Angular와 동일 로직) :contentReference[oaicite:6]{index=6}
  useEffect(() => {
    const isAndroid = /Android/.test(navigator.appVersion);
    if (!isAndroid) return;

    window.addEventListener("resize", focusOnWriting);
    return () => window.removeEventListener("resize", focusOnWriting);
  }, []);

  // text length 제한 (Angular: length(v) > MAX_LENGTH면 limit) :contentReference[oaicite:7]{index=7}
  useEffect(() => {
    if (strLength(form.text) > letterMaxLength) {
      setForm((prev) => ({
        ...prev,
        text: strLimit(prev.text, letterMaxLength),
      }));
    }
  }, [form.text, letterMaxLength]);

  // step이 Preview가 아니면 플립 토글 꺼짐 (Angular 동일) :contentReference[oaicite:8]{index=8}
  useEffect(() => {
    if (currentStep !== Step.Preview) setIsActiveFlip(false);
  }, [currentStep]);

  // 카드 흔들기 애니메이션 (Angular shakeCard) :contentReference[oaicite:9]{index=9}
  const shakeCard = () => {
    const el = flipCardRef.current;
    if (!el) return;
    el.classList.add("selected-motion");
    window.setTimeout(() => el.classList.remove("selected-motion"), 400);
  };

  // shape 바뀌면 흔들기 :contentReference[oaicite:10]{index=10}
  useEffect(() => {
    shakeCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.shape]);

  // 첫 렌더 후에도 한 번 흔들기 (Angular ngAfterViewInit) :contentReference[oaicite:11]{index=11}
  useEffect(() => {
    shakeCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validationAlertMessage = (): string | undefined => {
    // Angular: receiver -> text -> sender -> musicId 순서로 체크 :contentReference[oaicite:12]{index=12}
    let invalidElement: string | undefined;

    if (!form.receiver.trim()) invalidElement = "받는 이";
    else if (!form.text.trim()) invalidElement = "편지";
    else if (!form.sender.trim()) invalidElement = "보내는 이";
    else if (!form.musicId) invalidElement = "음악";

    return invalidElement ? koreanSuffix(`${invalidElement}을(를)`) : undefined;
  };

  const goMain = () => {
    confirm("작성중인 편지는 저장되지 않아요.\n 메인으로 돌아가시겠어요?", {
      confirm: {
        text: "네, 돌아갈게요",
        fn: () => navigate("/"),
      },
      cancel: { text: "취소" },
    });
  };

  const onClickPrev = () => {
    switch (currentStep) {
      case Step.Card:
        goMain();
        break;
      case Step.Music:
        setCurrentStep(Step.Card);
        break;
      case Step.Text:
        setCurrentStep(Step.Music);
        break;
      case Step.Preview:
        setCurrentStep(Step.Text);
        break;
    }
  };

  const onClickNext = () => {
    switch (currentStep) {
      case Step.Card:
        setCurrentStep(Step.Music);
        break;

      case Step.Music:
        if (!form.musicId) {
          alert(
            "받는 이를 위한 음악을 선택해주세요. \n재생 아이콘을 탭하여 들어볼 수 있어요."
          );
          return;
        }
        setCurrentStep(Step.Text);
        break;

      case Step.Text: {
        const msg = validationAlertMessage();
        if (msg) {
          alert(`앗, ${msg} 깜빡하신 것 같아요!`);
          return;
        }
        setCurrentStep(Step.Preview);
        break;
      }

      case Step.Preview:
        // preview에서는 Next 버튼이 없음(저장하기 버튼만) :contentReference[oaicite:13]{index=13}
        break;
    }
  };

  const onToggleFlip = () => {
    // Angular: Preview일 때만 토글 :contentReference[oaicite:14]{index=14}
    if (currentStep === Step.Preview) setIsActiveFlip((v) => !v);
  };

  const onSave = () => {
    confirm("카드를 저장한 후에는 수정할 수 없어요.\n카드를 저장하시겠어요?", {
      confirm: {
        text: "저장",
        fn: async () => {
          try {
            const payload: PostCardReq = {
              shape: form.shape,
              text: form.text,
              musicId: form.musicId,
              sender: form.sender,
              receiver: form.receiver,
            };

            const res = await postCard(payload);

            if (res.cardId) {
              alert(
                "카드가 저장되었어요! \n확인하고 친구에게 공유하러 가볼까요?",
                {
                  confirm: {
                    text: "보러갈래요",
                    fn: () => navigate(`/card/${res.cardId}/preview`),
                  },
                }
              );
            }
          } catch (e) {
            const msg =
              typeof e === "object" && e && "errorMessage" in e
                ? String((e as { errorMessage?: unknown }).errorMessage ?? "")
                : "";
            alert(msg || "문제가 발생했습니다. \n나중에 다시 시도해주세요.");
          }
        },
      },
      cancel: { text: "취소" },
    });
  };

  return (
    <form>
      <div className="editor-container">
        {/* 타이틀 */}
        <div className="title">
          <h1 className="font-h1-kr">{EDITOR_TITLE[currentStep].kr}</h1>
          <h1 className="font-h1">{EDITOR_TITLE[currentStep].en}</h1>
          {currentStep === Step.Preview && (
            <p className="font-desc">카드를 탭하면 편지내용을 볼 수 있어요!</p>
          )}
        </div>

        {/* 카드 뷰어 */}
        <div
          className="preview-container"
          onClick={onToggleFlip}
          role="button"
          tabIndex={-1}
        >
          <div
            ref={flipCardRef}
            className={[
              "flip-card",
              form.shape, // ngClass=cardShape.type :contentReference[oaicite:15]{index=15}
              currentStep === Step.Text ? "flipped" : "",
              isActiveFlip ? "active-preview" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <div className="preview">
                  <CardObject cardType={form.shape} />
                </div>
              </div>

              <div className="flip-card-back">
                <div className="preview">
                  <CardObject cardType={form.shape} />

                  {/* 편지 입력 */}
                  {currentStep === Step.Text && (
                    <div className="text-editor">
                      <div className="flexbox input-to">
                        <span className="font-sub">to.</span>
                        <input
                          type="text"
                          maxLength={25}
                          value={form.receiver}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, receiver: e.target.value }))
                          }
                        />
                      </div>

                      <div className="letter-textbox">
                        <textarea
                          value={form.text}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, text: e.target.value }))
                          }
                        />
                        <div className="text-length-inform">
                          {currentLetterLength} / {letterMaxLength}
                        </div>
                      </div>

                      <div className="flexbox input-from">
                        <span className="font-sub">from.</span>
                        <input
                          type="text"
                          maxLength={25}
                          value={form.sender}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, sender: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* 프리뷰에서 편지 보기 */}
                  {currentStep === Step.Preview && (
                    <TextViewer
                      receiver={form.receiver}
                      sender={form.sender}
                      text={form.text}
                      music={selectedMusic}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 에디터 컨트롤 */}
        <div className="editor-controls">
          {currentStep === Step.Card && (
            <FormCardShape
              value={form.shape}
              onChange={(shape) => setForm((p) => ({ ...p, shape }))}
            />
          )}
          {currentStep === Step.Music && (
            <FormMusicPlaylist
              value={form.musicId}
              onChange={(musicId) => setForm((p) => ({ ...p, musicId }))}
            />
          )}
        </div>

        {/* 페이지 이동 버튼 */}
        <div className="button-container">
          <button
            className="button-default"
            type="button"
            onClick={onClickPrev}
          >
            {currentStep === Step.Card ? "처음으로" : "이전 단계"}
          </button>

          {currentStep !== Step.Preview ? (
            <button
              className="button-highlight"
              type="button"
              onClick={onClickNext}
            >
              {currentStep === Step.Text ? "완성된 카드 확인" : "다음 단계"}
            </button>
          ) : (
            <button className="button-highlight" type="button" onClick={onSave}>
              저장하기
            </button>
          )}
        </div>
      </div>

      {/* 음악 미리듣기: Preview + flip 활성일 때만 노출 :contentReference[oaicite:16]{index=16} */}
      {currentStep === Step.Preview &&
        isActiveFlip &&
        musicIdNumber != null && (
          <>
            <div className="player-ui">
              <div onClick={onToggleFlip} role="button" tabIndex={-1} />
            </div>
            <div id="player" className="playing-motion">
              <YoutubePlayer musicId={musicIdNumber} />
            </div>
          </>
        )}
    </form>
  );
}
