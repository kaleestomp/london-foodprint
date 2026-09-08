import RatingCardSet from './RatingCardSet/RatingCardSet';
import WilsonBasisCardSet from './WilsonBasisCardSet/WilsonBasisCardSet';
import TierBasisCardSet from './TierBasisCardSet/TierBasisCardSet';
import './RatingFilterPanel.css';

const RatingFilterPanel: React.FC = () => {
  return (
    <div className="rating-panel-content">
      <RatingCardSet />
      <div className="rating-panel-divider" role="separator" />
      <TierBasisCardSet />
      <div className="rating-panel-divider" role="separator" />
      <WilsonBasisCardSet />
    </div>
  );
};

export default RatingFilterPanel;
