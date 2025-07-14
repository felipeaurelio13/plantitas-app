import { useEffect, RefObject } from 'react';

interface UseIntersectionObserverProps {
  onIntersect: () => void;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export const useIntersectionObserver = (
  ref: RefObject<Element>,
  { onIntersect, threshold = 0, rootMargin = '0px', once = true }: UseIntersectionObserverProps
) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onIntersect();
          if (once) {
            observer.unobserve(element);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, onIntersect, threshold, rootMargin, once]);
};