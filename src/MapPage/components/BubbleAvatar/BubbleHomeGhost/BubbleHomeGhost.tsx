import { motion } from 'framer-motion';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';

import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import { useIsMobileCtx } from '../../../../context/IsMobileContext';
import DashedCircle from '../Searchmask/DashedCircle';
import useBubbleStyle from '../BubbleAvatarHome/hooks/useBubbleStyle';
import './BubbleHomeGhost.css';

/**
 * Home reset action rendered at BubbleButton's fixed home position while the
 * avatar is away from home. The ring scales up when the avatar is close
 * enough to trigger snap-back behavior.
 */
const BubbleHomeGhost: React.FC<{
  /** Returns the avatar to home from any active state */
  onResetHome: () => void;
}> = ({ onResetHome }) => {

  const isMobile = useIsMobileCtx();
  const ghostStyle = useBubbleStyle( isMobile ? 'mobile-home' : undefined);
  const { isNearHome } = useBubbleAvatarState();

  if (typeof document === 'undefined') return null;
  return (
    <motion.button
      className="bubble-home-reset"
      style={ghostStyle}
      onClick={onResetHome}
      aria-label="Return avatar to home"
      title="Return avatar home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.88 }}
      whileTap={{ scale: 0.9 }}
      exit={{ opacity: 0 }}
      transition={{ opacity: { duration: 0.2, ease: 'easeOut' } }}
    >
      <motion.div
        className="bubble-home-reset-ring"
        animate={{ scale: isNearHome ? 1.16 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <DashedCircle className="bubble-home-reset-ring-svg" />
      </motion.div>
      <ReplayRoundedIcon fontSize="large" aria-hidden="true" />
    </motion.button>
  );
};

export default BubbleHomeGhost;
