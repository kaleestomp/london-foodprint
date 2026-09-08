import type { ReactNode } from 'react';
import './RatingCard.css';

const RatingCard: React.FC<{
  icon: ReactNode;
  label: string;
  icon_secondary?: ReactNode;
  selected: boolean;
  onClick: () => void;
}> = ({ icon, label, icon_secondary, selected, onClick }) => (
  <button
    type="button"
    className={`rating-card${selected ? ' is-active' : ''}`}
    aria-label={`${label}`}
    aria-pressed={selected}
    onClick={onClick}
  >
    {icon_secondary && <span className="rating-card-icon" aria-hidden="true">{icon_secondary}</span>}
    {icon}
    <span className="rating-card-label">{label}</span>
  </button>
);

export default RatingCard;