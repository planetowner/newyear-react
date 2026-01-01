import type { Music } from '../../values/models';
import { newlineToBrHtml } from '../../values/utils';
import './TextViewer.scss';

export function TextViewer({
  receiver,
  sender,
  text,
  music,
}: {
  receiver: string;
  sender: string;
  text: string;
  music?: Music;
}) {
  return (
    <div className="text-preview">
      <div className="input-to">
        <span className="font-sub">to. </span>
        <span className="font-card">{receiver}</span>
      </div>

      <p
        className="font-card"
        // Angular에서 Pipe로 하던 newline-><br/> 처리 포팅
        dangerouslySetInnerHTML={{ __html: newlineToBrHtml(text) }}
      />

      <div className="input-from">
        <span className="font-sub">from. </span>
        <span className="font-card">{sender}</span>
      </div>

      {music && (
        <div className="inform-music">
          ♪ {music.name} - {music.artist}
        </div>
      )}
    </div>
  );
}
