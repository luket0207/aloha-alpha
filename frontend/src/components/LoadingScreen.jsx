import Shaka from './Shaka.jsx';
import './LoadingScreen.scss';

export default function LoadingScreen({ fading, variant }) {
  return (
    <div
      className={`aloha-loading aloha-loading--${variant}${fading ? ' is-fading' : ''}`}
      lang="ja"
      role="status"
    >
      <Shaka className="aloha-loading__shaka" />
      <p>読み込み中</p>
    </div>
  );
}
