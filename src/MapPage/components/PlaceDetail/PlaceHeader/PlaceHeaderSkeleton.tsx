import type { FC } from 'react';
import Skeleton from '@mui/material/Skeleton';

const PlaceHeaderSkeleton: FC<{
    compact?: boolean;
}> = ({ compact = false }) => (
    <div className={`place-header ${compact ? 'is-closed' : 'is-open'}`} aria-busy="true">
        <div className="place-header-side-panel left">
            <Skeleton variant="circular" width={56} height={56} />
        </div>

        <div className="place-header-center-column">
            <Skeleton
                variant="text"
                sx={{
                    fontSize: compact ? '1rem' : '1.1rem',
                    lineHeight: 1.3,
                    width: compact ? '72%' : '58%',
                    maxWidth: '420px',
                }}
            />
            {compact && (
                <>
                    <Skeleton
                        variant="text"
                        sx={{
                            mt: 0.3,
                            fontSize: '0.8rem',
                            lineHeight: 1.3,
                            width: '48%',
                            maxWidth: '280px',
                        }}
                    />
                    <Skeleton
                        variant="text"
                        sx={{
                            mt: 0.3,
                            fontSize: '0.8rem',
                            lineHeight: 1.3,
                            width: '62%',
                            maxWidth: '340px',
                        }}
                    />
                </>
            )}
        </div>

        <div className="place-header-side-panel right">
            <Skeleton variant="circular" width={60} height={60} />
        </div>
    </div>
);

export default PlaceHeaderSkeleton;
