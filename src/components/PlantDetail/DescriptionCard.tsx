import React from 'react';
import { BookOpen, Star } from 'lucide-react';

interface DescriptionCardProps {
  species: string;
  description?: string;
  funFacts?: string[];
}

export const DescriptionCard: React.FC<DescriptionCardProps> = ({ species, description, funFacts }) => {
  return (
    <div className="bg-background p-6 rounded-lg shadow-lg w-full">
      {/* Description Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center">
          <BookOpen className="mr-3 text-primary" />
          Acerca de {species}
        </h3>
        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {description || 'No hay una descripción disponible para esta planta.'}
        </p>
      </div>

      {/* Fun Facts Section */}
      {funFacts && funFacts.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center">
            <Star className="mr-3 text-yellow-500" />
            Datos Curiosos
          </h3>
          <ul className="space-y-3">
            {funFacts.map((fact, index) => (
              <li key={index} className="flex items-start">
                <Star size={16} className="text-yellow-500 mt-1 mr-3 flex-shrink-0" />
                <p className="text-muted-foreground">{fact}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 