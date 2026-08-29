import type { FC } from 'react';
import FilterButtons from '../../BaseToolbar/FilterButtons';
import './AboveDrawer.css';

const AboveDrawer: FC = () => {
    return (
        <div className="above-drawer">
            <FilterButtons />
        </div>
    );
};

export default AboveDrawer;
