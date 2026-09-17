import Skeleton from '@mui/material/Skeleton';
import './PlaceBody.css';

const SkeletonRow = ({
    width = '42%',
    lines = 1,
}: {
    width?: string;
    lines?: number;
}) => (
    <div className="place-body-row">
        <span className="place-body-icon" aria-hidden="true">
            <Skeleton variant="circular" width={24} height={24} />
        </span>
        <div className="place-body-block">
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                {Array.from({ length: lines }, (_, index) => (
                    <Skeleton
                        key={index}
                        variant="text"
                        width={index === lines - 1 ? width : '88%'}
                        sx={{ fontSize: '1rem', lineHeight: 1.35 }}
                    />
                ))}
            </div>
        </div>
    </div>
);

const PlaceBodySkeleton = () => {
    return (
        <div className="place-body" aria-busy="true">
            <div className="place-body-rows">
                <SkeletonRow width="36%" />
                <SkeletonRow width="24%" />
                <SkeletonRow width="42%" />
                <SkeletonRow width="30%" />
                <SkeletonRow width="38%" />
            </div>
            <SkeletonRow width="68%" lines={3} />
            <SkeletonRow width="32%" />
            <SkeletonRow width="54%" />
            <SkeletonRow width="78%" lines={2} />
        </div>
    );
};

export default PlaceBodySkeleton;