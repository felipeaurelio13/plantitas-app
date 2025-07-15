import { PlantImage } from "@/schemas";
import { Card, CardContent } from "../ui/Card";
import LazyImage from "../LazyImage";

interface ImageGalleryProps {
  images: PlantImage[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  if (!images || images.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No hay imágenes para esta planta todavía.</p>
        </CardContent>
      </Card>
    );
  }

  const sortedImages = [...images].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="mt-4">
       <h2 className="text-xl font-bold tracking-tight mb-2">Galería de Imágenes</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {sortedImages.map((image) => (
          <div key={image.id} className="aspect-square relative rounded-lg overflow-hidden">
            <LazyImage
              src={image.url}
              alt={`Imagen de planta del ${new Date(image.timestamp).toLocaleDateString()}`}
              className="w-full h-full object-cover"
            />
             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs font-semibold">
                {new Date(image.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 