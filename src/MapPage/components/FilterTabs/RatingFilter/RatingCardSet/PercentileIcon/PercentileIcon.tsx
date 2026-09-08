import './PercentileIcon.css';

const PercentileIcon: React.FC<{
  percentile: number | string;
}> = ({ percentile }) => (
    <span className="percentile-icon">
      {percentile}
      {percentile !== 'all' && <span className="percentile-sign">%</span>}
    </span>
);

export default PercentileIcon;