import React from 'react';
import { Sparkles, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface DescriptionCardProps {
  species: string;
  description?: string;
  funFacts?: string[];
}

export const DescriptionCard: React.FC<DescriptionCardProps> = ({ funFacts }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div 
      className="bg-white/0 dark:bg-transparent p-3 sm:p-4 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Fun Facts Section */}
      {funFacts && funFacts.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center mb-6">
            <div className="p-3 bg-yellow-500/10 rounded-full mr-4">
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">
                Datos Curiosos
              </h3>
              <p className="text-sm text-muted-foreground">
                Descubre cosas increíbles sobre esta planta
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            {funFacts.map((fact, index) => (
              <motion.div 
                key={index} 
                className="group flex items-start bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 transition-all duration-300 hover:shadow-md"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex-shrink-0 mr-4 mt-1">
                  <div className="relative">
                    <Lightbulb className="w-5 h-5 text-yellow-500 group-hover:text-yellow-600 transition-colors" />
                    <div className="absolute -inset-2 bg-yellow-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pulse"></div>
                  </div>
                </div>
                <p className="text-foreground/90 leading-relaxed font-medium group-hover:text-foreground transition-colors">
                  {fact}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      {/* Empty state for fun facts */}
      {(!funFacts || funFacts.length === 0) && (
        <motion.div 
          className="mt-8 flex items-center justify-center p-6 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20"
          variants={itemVariants}
        >
          <div className="text-center">
            <Sparkles className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-muted-foreground font-medium">
              No hay datos curiosos disponibles
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              ¡Pronto agregaremos información interesante!
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}; 