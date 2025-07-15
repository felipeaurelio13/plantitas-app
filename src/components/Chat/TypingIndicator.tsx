import React from 'react';
import { motion, Easing } from 'framer-motion';

const TypingIndicator: React.FC = () => {
  const bubbleVariants = {
    initial: { y: 0 },
    animate: {
      y: [0, -4, 0],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut' as Easing,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-end gap-2"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xl">
        🌱
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-lg bg-muted px-4 py-3">
        <motion.div
          variants={bubbleVariants}
          animate="animate"
          style={{ transitionDelay: '0s' }}
          className="h-2 w-2 rounded-full bg-muted-foreground/50"
        />
        <motion.div
          variants={bubbleVariants}
          animate="animate"
          style={{ transitionDelay: '0.2s' }}
          className="h-2 w-2 rounded-full bg-muted-foreground/50"
        />
        <motion.div
          variants={bubbleVariants}
          animate="animate"
          style={{ transitionDelay: '0.4s' }}
          className="h-2 w-2 rounded-full bg-muted-foreground/50"
        />
      </div>
    </motion.div>
  );
};

export default TypingIndicator; 