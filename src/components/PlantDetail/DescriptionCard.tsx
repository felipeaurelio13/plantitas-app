import React from 'react';
import { BookOpen, Sparkles, Lightbulb, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface DescriptionCardProps {
  species: string;
  description?: string;
  funFacts?: string[];
}

export const DescriptionCard: React.FC<DescriptionCardProps> = ({ species, description, funFacts }) => {
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
      className="bg-gradient-to-br from-background via-background to-muted/30 p-6 rounded-2xl shadow-lg border border-border/50 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Description Section */}
      <motion.div className="mb-8" variants={itemVariants}>
        <div className="flex items-center mb-6">
          <div className="p-3 bg-primary/10 rounded-full mr-4">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              Acerca de tu {species}
            </h3>
            <p className="text-sm text-muted-foreground">
              Conoce más sobre esta fascinante especie
            </p>
          </div>
        </div>
        
        {description ? (
          <div className="relative">
            <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary to-primary/30 rounded-full"></div>
            <p className="text-foreground/90 leading-relaxed text-base pl-6 font-light">
              {description}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center p-8 bg-muted/50 rounded-xl border-2 border-dashed border-muted-foreground/20">
            <div className="text-center">
              <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground font-medium">
                No hay descripción disponible
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Información sobre esta planta no está disponible en este momento
              </p>
            </div>
          </div>
        )}
      </motion.div>

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
      {(!funFacts || funFacts.length === 0) && description && (
        <motion.div 
          className="mt-8 flex items-center justify-center p-6 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20"
          variants={itemVariants}
        >
          <div className="text-center">
            <Sparkles className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
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