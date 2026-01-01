import { Link } from 'react-router-dom';
import './NotFound.scss';

export default function NotFound() {
  return (
    <div className="not-found-container">
      <h1 className="font-404">404</h1>
      <h1 className="font-h1">Not Found</h1>
      <p className="font-desc">잘못된 주소입니다.</p>

      <Link to="/">
        <div className="button-default">메인페이지로</div>
      </Link>
    </div>
  );
}
