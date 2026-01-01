import { Link } from "react-router-dom";
import "./Landing.scss";

export default function Landing() {
  return (
    <div className="container">
      <h1 className="font-h1">
        2026,
        <br />
        Happy New Year!
        <br />
      </h1>

      <h3 className="font-h3">
        1월 1일!
        <br />
        새해 첫날, 처음으로 듣는 노래가
        <br />
        한 해를 결정한다는 말, 들어보셨나요?
        <br />
        소중한 사람에게 새해 카드와 함께
        <br />올 한 해를 결정할지도 모를 노래를 선물하는 건 어떨까요?
      </h3>

      <div className="landing-actions">
        <Link to="/editor" className="button-default button-editor">
          새해 카드 만들기
        </Link>

        <a
          className="button-ghost button-recommend"
          href="https://docs.google.com/forms/d/e/1FAIpQLSfFpwfz5d9uu4n74ktNDAypLc2K9Cu0_9eNaj3ABrLb_VSFrg/viewform?usp=sf_link"
          target="_blank"
          rel="noreferrer"
        >
          새해띵곡 추천하기
        </a>
      </div>

      <p className="instagram-link">
        created by{" "}
        <a
          href="https://www.instagram.com/planetowner/"
          target="_blank"
          rel="noreferrer"
        >
          @planetowner
        </a>
      </p>
    </div>
  );
}
