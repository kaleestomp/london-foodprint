import { motion, type Transition, type Easing } from 'framer-motion';
import './AnimatedLoadingDots.css';

/**
 * Animated loading indicator with 3 staggered jumping dots.
 * Used to show activity during async operations.
 */
const AnimatedLoadingDots: React.FC<{ size?: 'small' | 'medium' }> = ({ size = 'small' }) => {
  const dotSize = size === 'small' ? 6 : 8;
  const containerVariants = {
    start: {
      transition: {
        staggerChildren: 0.1,
      },
    },
    end: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const dotVariants = {
    start: { y: 5 },
    end: { y: -5 },
  };

  const dotTransition: Transition = {
    duration: 0.6,
    repeat: Infinity,
    repeatType: 'reverse',
    ease: 'easeInOut' as Easing,
  };

  return (
    <motion.div
      className="animated-loading-dots"
      variants={containerVariants}
      initial="start"
      animate="end"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="dot"
          variants={dotVariants}
          transition={dotTransition}
          style={{
            width: dotSize,
            height: dotSize,
          }}
        />
      ))}
    </motion.div>
  );
};

export default AnimatedLoadingDots;
