import type { FC } from 'react';
import './ShowMoreButton.css';

const ShowMoreButton: FC<{
    onClick: () => void;
}> = ({ onClick }) => (
    <button
        type="button"
        className="place-detail-show-more"
        onClick={onClick}
    >
        More Listings
    </button>
);

export default ShowMoreButton;
