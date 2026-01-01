import { useMemo } from 'react';
import { MUSICS } from '../../values/value';
import { getUrlParameter, isMobile } from '../../values/utils';

export function YoutubePlayer({ musicId }: { musicId?: number }) {
  const videoId = useMemo(() => {
    if (musicId == null) return undefined;
    const m = MUSICS.find((x) => x.id === musicId);
    if (!m) return undefined;
    return getUrlParameter(m.youtubeLink, 'v');
  }, [musicId]);

  const src = useMemo(() => {
    if (!videoId) return '';
    // autoplay는 브라우저 정책 때문에 막힐 수 있음(특히 모바일)
    // 모바일이면 autoplay=0으로 두고, 데스크탑은 1로 시도
    const autoplay = isMobile() ? 0 : 1;
    // playsinline: iOS에서 전체화면 강제 방지
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}&playsinline=1&rel=0&modestbranding=1`;
  }, [videoId]);

  if (!videoId) return null;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <iframe
        width="100%"
        height="100%"
        src={src}
        title="YouTube player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
