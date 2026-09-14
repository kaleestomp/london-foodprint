import Skeleton from '@mui/material/Skeleton';
import './PlaceDetailBody.css';

const PlaceDetailBodySkeleton = (
) => {
    return (
        <div className="place-detail-body" aria-busy="true">
            {Array.from({ length: 8 }, (_, index) => (
                <div className="place-detail-body-row" key={index}>
                    <span className="place-detail-body-icon" aria-hidden="true">
                        <Skeleton variant="circular" width={20} height={20} />
                    </span>
                    <Skeleton variant="text" width="70%" />
                </div>
            ))}
        </div>
    );
};

export default PlaceDetailBodySkeleton;