import React from 'react';
import { motion } from 'framer-motion';

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
}

const SettingsGroup = ({ title, children, delay = 0 }: SettingsGroupProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className="space-y-3"
    >
      <h2 className="text-lg font-bold text-foreground px-4">
        {title}
      </h2>
      <div className="bg-muted/50 rounded-2xl overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
};

export default SettingsGroup; 