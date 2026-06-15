import type { ReactNode } from 'react';
import Typography from '@mui/material/Typography';
import './FilterTabPanel.css';

type Props = {
  title: string;
  children: ReactNode;
  headerContent?: ReactNode;
  className?: string;
};

const FilterTabPanel: React.FC<Props> = ({ title, children, headerContent, className }) => {
  return (
    <div className={`filter-tab-panel${className ? ` ${className}` : ''}`}>
      <div className="filter-tab-panel__header">
        <Typography className="filter-tab-panel__title">{title}</Typography>
        {headerContent ? <div className="filter-tab-panel__header-content">{headerContent}</div> : null}
      </div>
      <div className="filter-tab-panel__chips">{children}</div>
    </div>
  );
};

export default FilterTabPanel;
