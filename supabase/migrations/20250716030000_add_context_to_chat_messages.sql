-- Agrega el campo context para insights/contexto IA en mensajes de chat de planta
ALTER TABLE public.chat_messages
ADD COLUMN context jsonb DEFAULT NULL; 