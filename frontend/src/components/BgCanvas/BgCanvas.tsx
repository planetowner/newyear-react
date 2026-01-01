import './BgCanvas.scss';

export function BgCanvas() {
  return (
    <ul className="g-snows" id="jsi-snows">
      {Array.from({ length: 100 }).map((_, i) => (
        <li key={i} />
      ))}
    </ul>
  );
}
