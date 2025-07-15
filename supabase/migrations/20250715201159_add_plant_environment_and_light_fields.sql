-- Agregar campos para ambiente de planta y necesidades de luz
ALTER TABLE public.plants 
ADD COLUMN plant_environment TEXT CHECK (plant_environment IN ('interior', 'exterior', 'ambos')),
ADD COLUMN light_requirements TEXT CHECK (light_requirements IN ('poca_luz', 'luz_indirecta', 'luz_directa_parcial', 'pleno_sol'));

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN public.plants.plant_environment IS 'Indica si la planta es de interior, exterior o puede estar en ambos ambientes';
COMMENT ON COLUMN public.plants.light_requirements IS 'Especifica las necesidades de luz de la planta: poca_luz, luz_indirecta, luz_directa_parcial, pleno_sol';
