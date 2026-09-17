import type { FC } from 'react';

import './CloseButton.css';

const CloseButton: FC<{
    onClick: () => void;
}> = ({ onClick }) => (
    <button
        type="button"
        className="place-detail-show-more"
        aria-label="close"
        onClick={onClick}
    >
        More Listings
    </button>
);

export default CloseButton;
