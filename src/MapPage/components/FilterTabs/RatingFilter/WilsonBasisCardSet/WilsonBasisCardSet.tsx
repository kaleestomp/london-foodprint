import JoinInnerIcon from '@mui/icons-material/JoinInner';
import StarsIcon from '@mui/icons-material/Stars';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import RatingCard from '../RatingCard/RatingCard';
import './WilsonBasisCardSet.css';

const wilsonBasisOptions = [
  { basis: 0, label: 'Favour high ratings', mark: <StarsIcon className="wilson-basis-icon" aria-hidden="true" /> },
  { basis: 1, label: 'Neutral', mark: <JoinInnerIcon className="wilson-basis-icon" aria-hidden="true" /> },
  { basis: 2, label: 'Favour popularity', mark: <ThumbUpAltIcon className="wilson-basis-icon" aria-hidden="true" /> },
] as const;

const WilsonBasisCardSet: React.FC = () => {
  const { wilsonBasis, setWilsonBasis } = useSearchFilters();

  return (
    <div className="rating-filter-cards" role="group" aria-label="Wilson score basis">
      {wilsonBasisOptions.map((option) => {
        const selected = wilsonBasis === option.basis;
        return (
          <RatingCard
            key={option.basis}
            icon={<span className="wilson-basis-mark" aria-hidden="true">{option.mark}</span>}
            label={option.label}
            selected={selected}
            onClick={() => setWilsonBasis(option.basis)}
          />
        );
      })}
    </div>
  );
};

export default WilsonBasisCardSet;
