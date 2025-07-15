import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface EmptyChatProps {
  plantName: string;
}

const EmptyChat: React.FC<EmptyChatProps> = ({ plantName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-1 flex-col items-center justify-center text-center p-8"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground">
        Inicia una conversación
      </h3>
      <p className="text-muted-foreground max-w-xs">
        {plantName} está esperando para charlar. ¡Pregúntale sobre sus cuidados o simplemente saluda!
      </p>
    </motion.div>
  );
};

export default EmptyChat; 