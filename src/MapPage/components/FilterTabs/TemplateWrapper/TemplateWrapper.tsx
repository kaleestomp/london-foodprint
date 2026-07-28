import type { ReactNode } from 'react';
import Typography from '@mui/material/Typography';
import './TemplateWrapper.css';

type Props = {
  title: string;
  children: ReactNode;
  headerContent?: ReactNode;
};

const TemplateWrapper: React.FC<Props> = ({ title, children, headerContent }) => {
  return (
    <div className="filter-tab-panel">
      <div className="filter-tab-panel__header">
        <Typography className="filter-tab-panel__title">{title}</Typography>
        {headerContent ? <div className="filter-tab-panel__header-content">{headerContent}</div> : null}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default TemplateWrapper;
