import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './supabase';

/**
 * Combina clases de CSS usando clsx y tailwind-merge
 * Permite mergear clases de Tailwind de manera eficiente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-ES').format(num);
}

/**
 * Formatea una fecha de manera legible
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);
}

/**
 * Formatea una fecha de manera relativa (hace 2 días, etc.)
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMilliseconds = now.getTime() - d.getTime();
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Hoy';
  } else if (diffInDays === 1) {
    return 'Ayer';
  } else if (diffInDays < 7) {
    return `Hace ${diffInDays} días`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
  } else {
    return formatDate(d);
  }
}

/**
 * Capitaliza la primera letra de una cadena
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convierte un Data URL a un objeto File.
 */
export function dataURLtoFile(dataurl: string, filename: string): File | null {
  const arr = dataurl.split(',');
  if (arr.length < 2) {
    return null;
  }
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || mimeMatch.length < 2) {
    return null;
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

/**
 * Genera un ID único simple
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Helper function to invoke Supabase Edge Functions with proper JWT authentication
 */
export const invokeAuthenticatedFunction = async (
  functionName: string,
  body: any,
  options?: { headers?: Record<string, string> }
) => {
  // Obtener el JWT token del usuario autenticado
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session?.access_token) {
    console.error('User session not available:', authError);
    throw new Error('Usuario no autenticado. Por favor inicia sesión nuevamente.');
  }

  return supabase.functions.invoke(functionName, {
    body,
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      ...options?.headers,
    },
  });
};