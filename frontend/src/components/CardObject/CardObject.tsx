// src/components/CardObject/CardObject.tsx
import { useMemo, useRef } from "react";
import "./CardObject.scss";

type Props = { cardType?: string; lettering?: string };

export function CardObject({ cardType, lettering = "default" }: Props) {
  const objRef = useRef<HTMLObjectElement | null>(null);

  const src = useMemo(() => {
    if (!cardType) return undefined;
    return `/assets/card/${cardType}.svg`; // Angular의 ./assets/card/*.svg :contentReference[oaicite:39]{index=39}
  }, [cardType]);

  const onLoad = () => {
    const obj = objRef.current;
    const svg = obj?.contentDocument?.querySelector(
      "svg"
    ) as SVGGraphicsElement | null;
    if (!svg) return;
    svg.classList.add(lettering || "default");
  };

  if (!src) return null;

  return (
    <div className={`svg-container ${lettering || "default"}`}>
      <object ref={objRef} data={src} height="100%" onLoad={onLoad} />
    </div>
  );
}
