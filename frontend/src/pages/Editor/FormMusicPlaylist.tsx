import { useMemo, useState } from "react";
import { isEmpty, isNil } from "lodash-es";

import type { Music } from "../../values/models";
import { MUSICS } from "../../values/value";
import { isMobile } from "../../values/utils";
import { usePopup } from "../../popup/usePopup";
import { YoutubePlayer } from "../../components/YoutubePlayer/YoutubePlayer";

import "./FormMusicPlaylist.scss";

function newlineToBrHtml(value: string) {
  return value.replace(/\n/g, "<br/>");
}

export function FormMusicPlaylist({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { confirm } = usePopup();

  const musics: Music[] = useMemo(
    () => [...MUSICS].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );
  const selectedId = useMemo(() => {
    if (!isNil(value) && !isEmpty(value)) return Number.parseInt(value, 10);
    return undefined;
  }, [value]);

  const [playingMusic, setPlayingMusic] = useState<number | undefined>(
    undefined
  );
  const [showAlert, setShowAlert] = useState(false);

  const initYoutubePlayer = (musicId: number) => {
    setPlayingMusic(undefined);
    window.setTimeout(() => setPlayingMusic(musicId), 10);
  };

  const playMusic = (music: Music) => {
    if (!showAlert) {
      confirm(
        `이 음악을 들어보시겠어요? ${
          isMobile() ? "\n나타나는 플레이어의 재생버튼을 탭해주세요." : ""
        }`,
        {
          confirm: {
            fn: () => {
              setShowAlert(true);
              initYoutubePlayer(music.id);
            },
          },
          cancel: { text: "취소" },
        }
      );
      return;
    }
    initYoutubePlayer(music.id);
  };

  return (
    <>
      <div className="playlist-container open-playlist-action">
        <div className="playlist-wrapper">
          <div className="whitespace" />

          {musics.map((music) => (
            <label key={music.id}>
              <input
                type="radio"
                value={String(music.id)}
                checked={music.id === selectedId}
                onChange={() => onChange(String(music.id))}
              />

              <div className="music-item">
                <div
                  className="album-image"
                  style={{ backgroundImage: `url(${music.image})` }}
                />

                <div className="music-info">
                  <p className="music-name">{music.name}</p>
                  <p className="music-artist">{music.artist}</p>

                  {isMobile() && (
                    <p
                      className="music-lyrics"
                      style={{ whiteSpace: "break-spaces" }}
                    >
                      {music.lyrics}
                    </p>
                  )}
                </div>

                {!isMobile() && (
                  <div
                    className="music-lyrics"
                    dangerouslySetInnerHTML={{
                      __html: newlineToBrHtml(music.lyrics),
                    }}
                  />
                )}

                {/* ✅ 충돌 방지: icon-checked / icon-play → playlist 전용 클래스 */}
                <div className="playlist-icon-checked" />
                <div
                  className="playlist-icon-play"
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playMusic(music);
                  }}
                />
              </div>
            </label>
          ))}

          <div className="whitespace" />
        </div>
      </div>

      {playingMusic != null && (
        <>
          <div className="player-ui">
            <div
              onClick={() => setPlayingMusic(undefined)}
              role="button"
              tabIndex={-1}
            />
          </div>
          <div id="player" className="playing-motion">
            <YoutubePlayer musicId={playingMusic} />
          </div>
        </>
      )}
    </>
  );
}
