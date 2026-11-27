import { faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { clearPageFragment, resetScrollPosition } from './scrollManager.js';
import useReducedMotion from './useReducedMotion.js';
import './BackToTopButton.scss';

export default function BackToTopButton() {
  const reducedMotion = useReducedMotion();

  function goToTop() {
    clearPageFragment();
    resetScrollPosition(window, reducedMotion ? 'auto' : 'smooth');
  }

  return (
    <button aria-label="ページの先頭へ戻る" className="aloha-back-to-top" onClick={goToTop} type="button">
      <FontAwesomeIcon aria-hidden="true" icon={faChevronUp} />
    </button>
  );
}
