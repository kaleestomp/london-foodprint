import { useMemo } from 'react';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import { useIsMobileCtx } from '../../../../context/IsMobileContext';
import useHomeCenter from '../BubbleAvatarHome/hooks/useHomeCenter';
import DashedCircle from '../Searchmask/DashedCircle';
import './BubbleHomeGhost.css';

type Props = {
  /** Returns the avatar to home from any active state */
  onResetHome: () => void;
};

/**
 * Home reset action rendered at BubbleButton's fixed home position while the
 * avatar is away from home. The ring scales up when the avatar is close
 * enough to trigger snap-back behavior.
 */
const BubbleHomeGhost: React.FC<Props> = ({ onResetHome }) => {
  const isMobile = useIsMobileCtx();
  const { isNearHome } = useBubbleAvatarState();
  const homeCenter = useHomeCenter();
  const ghostStyle = useMemo(() => {
    if (!isMobile) return undefined;

    return {
      bottom: 'auto',
      top: `calc(${homeCenter.y}px - (var(--bubble-avatar-home-size) / 2))`,
    };
  }, [homeCenter.y, isMobile]);
  
  return (
    <button
      className="bubble-home-reset"
      style={ghostStyle}
      onClick={onResetHome}
      aria-label="Return avatar to home"
      title="Return avatar home"
    >
      <div
        className={`bubble-home-reset-ring${isNearHome ? ' is-near-home' : ''}`}
      >
        <DashedCircle className="bubble-home-reset-ring-svg" />
      </div>
      <ReplayRoundedIcon fontSize="large" aria-hidden="true" />
    </button>
  );
};

export default BubbleHomeGhost;
