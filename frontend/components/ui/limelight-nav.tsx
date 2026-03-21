"use client";

import React, { useState, useRef, useLayoutEffect, cloneElement, useEffect } from 'react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export type NavItem = {
  id: string | number;
  icon: React.ReactElement;
  label?: string;
  onClick?: () => void;
};

export interface LimelightNavProps {
  items?: NavItem[];
  defaultActiveIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
  limelightClassName?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
}

export const LimelightNav = ({
  items = [],
  defaultActiveIndex = 0,
  onTabChange,
  className,
  limelightClassName,
  iconContainerClassName,
  iconClassName,
}: LimelightNavProps) => {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);
  const [isReady, setIsReady] = useState(false);
  const navItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const limelightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveIndex(defaultActiveIndex);
  }, [defaultActiveIndex]);

  useLayoutEffect(() => {
    if (items.length === 0) return;
    const updateLimelight = () => {
      const limelight = limelightRef.current;
      const activeItem = navItemRefs.current[activeIndex];
      if (limelight && activeItem) {
        // Center the beam horizontally relative to the item
        const newLeft = activeItem.offsetLeft + activeItem.offsetWidth / 2 - limelight.offsetWidth / 2;
        limelight.style.left = `${newLeft}px`;
        if (!isReady) {
          const timer = setTimeout(() => setIsReady(true), 50);
          return () => clearTimeout(timer);
        }
      }
    };
    updateLimelight();
    window.addEventListener('resize', updateLimelight);
    return () => window.removeEventListener('resize', updateLimelight);
  }, [activeIndex, isReady, items]);

  if (items.length === 0) return null;

  return (
    <nav className={cn("relative inline-flex items-center h-20 px-2", className)}>
      {items.map(({ id, icon, label, onClick }, index) => (
        <a
          key={id}
          ref={(el) => { navItemRefs.current[index] = el }}
          className={cn(
            "relative z-20 flex flex-col h-full cursor-pointer items-center justify-center px-4 min-w-[80px] gap-1.5 transition-all duration-300",
            iconContainerClassName
          )}
          onClick={() => { setActiveIndex(index); onTabChange?.(index); onClick?.(); }}
          aria-label={label}
        >
          {/* Icon Rendering */}
          {cloneElement(icon as React.ReactElement, {
            className: cn(
              "transition-all duration-300",
              activeIndex === index ? "opacity-100 scale-110 text-indigo-400" : "opacity-30 scale-100 text-slate-400",
              (icon as React.ReactElement).props.className,
              iconClassName
            ),
          })}
          
          {/* Text Label Rendering */}
          {label && (
            <span className={cn(
              "text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 whitespace-nowrap",
              activeIndex === index ? "text-indigo-400 opacity-100" : "text-slate-500 opacity-40"
            )}>
              {label}
            </span>
          )}
        </a>
      ))}

      {/* The Limelight Indicator */}
      <div
        ref={limelightRef}
        className={cn(
          "absolute top-2 z-10 w-12 h-[2px] bg-indigo-500 shadow-[0_15px_30px_#6366f1]",
          isReady ? "transition-[left] duration-500 ease-in-out" : "opacity-0",
          limelightClassName
        )}
        style={{ left: '-999px' }}
      >
        <div className="absolute left-[-50%] top-0 w-[200%] h-16 [clip-path:polygon(20%_100%,40%_0,60%_0,80%_100%)] bg-gradient-to-b from-indigo-500/25 via-indigo-500/5 to-transparent pointer-events-none" />
      </div>
    </nav>
  );
};