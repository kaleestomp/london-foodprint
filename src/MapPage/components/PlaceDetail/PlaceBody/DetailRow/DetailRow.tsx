import type { FC, ReactNode } from 'react';
import Typography from '@mui/material/Typography';

import './DetailRow.css';

const valueOrDash = (value: ReactNode): ReactNode => value ?? '—';

const DetailRow: FC<{ 
    icon: ReactNode;
    value: ReactNode;
    label?: string;
    onClick?: () => void;
}> = ({ label, value, icon, onClick }) => {

	return (
        <div
            className="place-body-row"
            key={label}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick();
                }
            } : undefined}
        >
            <span className="place-body-icon" aria-hidden="true">{icon}</span>
            <div className="place-body-block">
                {label && (<Typography variant="caption" className="place-body-label">
                    {label}
                </Typography>)}
                <Typography variant="body1" sx={{ color: 'var(--app-text-caption-color)', whiteSpace: 'pre-line'}}>
                    {valueOrDash(value)}
                </Typography>
            </div>
        </div>
	);
};

export default DetailRow;
