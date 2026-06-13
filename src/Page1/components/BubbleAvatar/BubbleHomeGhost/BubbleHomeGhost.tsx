import { motion } from 'framer-motion';
import './BubbleHomeGhost.css';

type Props = {
  /** When true, scales up to signal the avatar is in the snap-back zone */
  isNearHome: boolean;
};

/**
 * Dashed circle rendered at BubbleButton's fixed home position while the
 * avatar is being carried. Scales up slightly when the carry position is
 * within HOME_SNAP_RADIUS of the home centre.
 */
const BubbleHomeGhost: React.FC<Props> = ({ isNearHome }) => (
  <motion.div
    className="bubble-home-ghost"
    animate={{ scale: isNearHome ? 1.16 : 1 }}
    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
  />
);

export default BubbleHomeGhost;
