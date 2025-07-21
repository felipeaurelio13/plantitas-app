import React from 'react';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from './ui/Card';

const PlantCardSkeleton: React.FC = () => {
  return (
    <Card variant="elevated" size="default" className="overflow-hidden">
      <div className="flex items-start p-4 space-x-4">
        <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <CardHeader className="p-0">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="p-0 mt-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-16 h-1.5" />
              <Skeleton className="w-8 h-3" />
            </div>
          </CardContent>
        </div>
      </div>
      <CardFooter className="bg-neutral-50 dark:bg-neutral-800/50 p-2 border-t border-subtle">
        <div className="flex justify-between items-center w-full">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </CardFooter>
    </Card>
  );
};

export default PlantCardSkeleton; 