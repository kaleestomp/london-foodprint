import { useEffect, useState } from 'react';
// import StoreIcon from '@mui/icons-material/Store';


import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import RatingCard from '../RatingCard/RatingCard';
import { DIVERSITY_THUMB_SVG, POPULARITY_THUMB_SVG } from '../Switch/Icons';
import './TierBasisCardSet.css';

const TierBasisIcon: React.FC<{ icon: string }> = ({ icon }) => (
    <span className="tier-basis-card-icon" aria-hidden="true" style={{ maskImage: icon, WebkitMaskImage: icon }} />
);
const TierBasisCardSet: React.FC = () => {
    const { scoreBasis, reportScoreBasis,
        allowBlockChain, setAllowBlockChain,
        // allowChain, setAllowChain,
    } = useSearchFilters();

    const [isDiversityCaped, setIsDiversityCaped] = useState(scoreBasis === 2 || scoreBasis === 1);
    useEffect(() => {
        const newScoreBasis = isDiversityCaped && allowBlockChain ? 1 : isDiversityCaped ? 2 : 0;
        reportScoreBasis(newScoreBasis);
    }, [isDiversityCaped, allowBlockChain, reportScoreBasis]);
    
    return (
        <div className="tier-basis-card-set" role="group" aria-label="Rating tier options">
            <RatingCard
                icon={<TierBasisIcon icon={DIVERSITY_THUMB_SVG} />}
                label='Diversity Cap'
                selected={isDiversityCaped}
                onClick={() => setIsDiversityCaped(prev => !prev)}
            />
            <RatingCard
                icon={<TierBasisIcon icon={POPULARITY_THUMB_SVG} />}
                label="Block Chains"
                selected={allowBlockChain}
                onClick={() => setAllowBlockChain(!allowBlockChain)}
            />
            {/* <RatingCard
                icon={<StoreIcon className="wilson-basis-icon" aria-hidden="true" />}
                label="Minor Chains"
                selected={allowChain}
                onClick={() => setAllowChain(!allowChain)}
            /> */}
        </div>
    );
};

export default TierBasisCardSet;