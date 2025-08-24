'use client';

import { useEffect, useRef } from 'react';

interface ScrollAnimationsProps {
  children: React.ReactNode;
  className?: string;
  animationType?: 'fade-in' | 'fade-in-up' | 'fade-in-down' | 'fade-in-left' | 'fade-in-right' | 'scale-in';
  delay?: number;
}

export default function ScrollAnimations({ 
  children, 
  className = '', 
  animationType = 'fade-in-up',
  delay = 0 
}: ScrollAnimationsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('animate');
            }, delay);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [delay]);

  const getAnimationClass = () => {
    switch (animationType) {
      case 'fade-in':
        return 'scroll-animate';
      case 'fade-in-up':
        return 'scroll-animate';
      case 'fade-in-down':
        return 'scroll-animate';
      case 'fade-in-left':
        return 'scroll-animate-left';
      case 'fade-in-right':
        return 'scroll-animate-right';
      case 'scale-in':
        return 'scroll-animate-scale';
      default:
        return 'scroll-animate';
    }
  };

  return (
    <div ref={ref} className={`${getAnimationClass()} ${className}`}>
      {children}
    </div>
  );
} 