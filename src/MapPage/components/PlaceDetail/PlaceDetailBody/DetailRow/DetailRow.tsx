import type { FC, ReactNode } from 'react';
import Typography from '@mui/material/Typography';

import './DetailRow.css';

const valueOrDash = (value: ReactNode): ReactNode => value ?? '—';

const DetailRow: FC<{ 
    icon: ReactNode;
    value: ReactNode;
    label?: string;
}> = ({ label, value, icon }) => {

	return (
        <div className="place-detail-body-row" key={label}>
            <span className="place-detail-body-icon" aria-hidden="true">{icon}</span>
            <div className="place-detail-body-copy">
                {label && (<Typography variant="caption" className="place-detail-body-label">
                    {label}
                </Typography>)}
                <Typography variant="h6" className="place-detail-body-value">
                    {valueOrDash(value)}
                </Typography>
            </div>
        </div>
	);
};

export default DetailRow;
