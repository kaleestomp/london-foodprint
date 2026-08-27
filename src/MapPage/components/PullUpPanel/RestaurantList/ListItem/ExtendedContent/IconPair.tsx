import type { FC, ReactNode } from 'react';
import './ExtendedContent.css';

const IconPair: FC<{
  icon: ReactNode;
  text: ReactNode;
}> = ({ icon, text }) => (
  <span className="list-item-meta-pair">
    {icon}
    <span>{text}</span>
  </span>
);

export default IconPair;