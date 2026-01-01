import type { PostCardReq } from "../../api/models";
import { CARD_LIST } from "../../values/value";
import { CardObject } from "../../components/CardObject/CardObject";
import "./FormCardShape.scss";

export function FormCardShape({
  value,
  onChange,
}: {
  value: PostCardReq["shape"];
  onChange: (v: PostCardReq["shape"]) => void;
}) {
  return (
    <div className="card-shape-options">
      {CARD_LIST.map((card) => (
        <label key={card.type}>
          <input
            type="radio"
            value={card.type}
            checked={value === card.type}
            onChange={() => onChange(card.type as PostCardReq["shape"])}
          />

          <div className={`card-shape-preview ${card.type}`}>
            <CardObject cardType={card.type} />

            {/* ✅ 클래스명 충돌 방지: icon-checked → shape-icon-checked */}
            <div className="shape-icon-checked" />
          </div>
        </label>
      ))}
    </div>
  );
}
