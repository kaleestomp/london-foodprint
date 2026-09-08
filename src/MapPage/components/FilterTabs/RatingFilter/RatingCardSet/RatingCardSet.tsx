import FavoriteIcon from '@mui/icons-material/Favorite';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { ratingOptions, RANK_BADGE } from '../RatingIcons';
import RatingCard from '../RatingCard/RatingCard';
import PercentileIcon from './PercentileIcon/PercentileIcon';
import './RatingCardSet.css';

const RatingCardSet: React.FC = () => {
  const { scoreTier, setScoreTier } = useSearchFilters();

  return (
    <div className="rating-filter-cards" role="group" aria-label="Rating filters">
      {ratingOptions.map((option) => {
        const selected = scoreTier === option.tier;
        const percentile = option.tier === 0 ? 'all' : option.tier === 1 ? 50 : option.tier === 2 ? 25 : option.tier === 3 ? 10 : 5;
        const icon = option.tier === 2
          ? <FavoriteIcon />
          : option.tier === 3 || option.tier === 4
            ? <RANK_BADGE tier={4} />
            : undefined;

        return (
          <RatingCard key={option.tier}
            icon={<PercentileIcon percentile={percentile} />}
            label={option.label}
            icon_secondary={icon}
            selected={selected}
            onClick={() => setScoreTier(selected ? 0 : option.tier)}
          />
        );
      })}
    </div>
  );
};

export default RatingCardSet;
