import React from 'react';

type Props = {
  className?: string;
  style?: React.CSSProperties;
  scale?: number;
};

/**
 * Reusable dashed circle with round stroke caps.
 * Uses currentColor from parent CSS for stroke color.
 */
const DashedCircle: React.FC<Props> = ({ className, style, scale = 1 }) => {
  const transform = scale !== 1 ? `scale(${scale})` : undefined;

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      style={transform ? { ...style, transform } : style}
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeDasharray="10 10"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export default DashedCircle;
