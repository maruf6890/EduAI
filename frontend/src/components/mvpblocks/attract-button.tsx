'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Magnet } from 'lucide-react';
import { animate, motion, useAnimation } from "framer-motion"; // Cleaned up duplicate import
import { useCallback, useEffect, useState } from 'react';

interface AttractButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly particleCount?: number;
  readonly attractRadius?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
}

export default function AttractButton({
  className,
  particleCount = 12,
  attractRadius = 50,
  ...props
}: AttractButtonProps) {
  const [isAttracting, setIsAttracting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const particlesControl = useAnimation();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize particles directly into state to eliminate the useEffect warning
  // const [particles] = useState<Particle[]>(() => {
  //   return Array.from({ length: particleCount }, (_, i) => {
  //     const angle = (i / particleCount) * Math.PI * 2;
  //     const radius = attractRadius * (0.7 + Math.random() * 0.3);
  //     return {
  //       id: i,
  //       x: Math.cos(angle) * radius,
  //       y: Math.sin(angle) * radius,
  //     };
  //   });
  // });
  // Initialize particles with a safe, deterministic varied layout (No Math.random!)
  const [particles] = useState<Particle[]>(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;

      // 🛠️ Uses pure index math instead of Math.random() 
      // Keeps the scattered organic look but guarantees 100% identical values on server & client!
      const uniqueScale = 0.75 + ((i * 7) % 5) * 0.05;
      const radius = attractRadius * uniqueScale;

      return {
        id: i,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  });

  const handleInteractionStart = useCallback(async () => {
    setIsAttracting(true);
    await particlesControl.start({
      x: 0,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 50,
        damping: 10,
      },
    });
  }, [particlesControl]);

  const handleInteractionEnd = useCallback(async () => {
    setIsAttracting(false);
    await particlesControl.start((i) => ({
      x: particles[i].x,
      y: particles[i].y,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    }));
  }, [particlesControl, particles]);

  return (
    <Button
      className={cn(
        'relative min-w-40 touch-none',
        'bg-primary/10 hover:bg-primary/20',
        'text-primary border-primary/30 border',
        'transition-all duration-300',
        className,
      )}
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      {...props}
    >
      {mounted && particles.map((particle) => (
        <motion.div
          key={particle.id}
          custom={particle.id}
          initial={{ x: particle.x, y: particle.y }}
          animate={particlesControl}
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          className={cn(
            'absolute h-1.5 w-1.5 rounded-full',
            'bg-primary',
            'transition-opacity duration-300',
            isAttracting ? 'opacity-100' : 'opacity-40',
          )}
        />
      ))}
      <span className="relative flex w-full items-center justify-center gap-2">
        <Magnet
          className={cn(
            'h-4 w-4 transition-transform duration-300',
            isAttracting && 'scale-110',
          )}
        />
        {isAttracting ? 'click' : props.children || 'Hover me'}
      </span>
    </Button>
  );
}
