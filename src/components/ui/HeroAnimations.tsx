/**
 * HeroAnimations.tsx
 * Animierte Vögel und Zirruswolken für den Hero-Bereich.
 */
import { useEffect, useState } from 'react';

const Bird = ({ delay = 0, duration = 18, startY = 20, size = 1 }: {
  delay?: number;
  duration?: number;
  startY?: number;
  size?: number;
}) => (
  <svg
    className="hero-bird"
    style={{
      '--bird-delay': `${delay}s`,
      '--bird-duration': `${duration}s`,
      '--bird-y': `${startY}%`,
      '--bird-size': size,
    } as React.CSSProperties}
    viewBox="0 0 40 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="hero-bird-wing"
      d="M20 12 C15 4, 8 2, 0 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      fill="none"
    />
    <path
      className="hero-bird-wing"
      d="M20 12 C25 4, 32 2, 40 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const CirrusCloud = ({ delay = 0, duration = 60, startY = 15, opacity = 0.4, width = 300 }: {
  delay?: number;
  duration?: number;
  startY?: number;
  opacity?: number;
  width?: number;
}) => (
  <svg
    className="hero-cirrus"
    style={{
      '--cirrus-delay': `${delay}s`,
      '--cirrus-duration': `${duration}s`,
      '--cirrus-y': `${startY}%`,
      '--cirrus-opacity': opacity,
      '--cirrus-width': `${width}px`,
    } as React.CSSProperties}
    viewBox="0 0 400 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 20 C40 15, 80 25, 120 18 C160 11, 200 22, 240 16 C280 10, 320 20, 360 14 C380 11, 395 16, 400 15"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.8"
      fill="none"
    />
    <path
      d="M20 28 C60 22, 100 30, 140 24 C180 18, 220 27, 260 22 C300 17, 340 25, 380 20"
      stroke="white"
      strokeWidth="1.4"
      strokeLinecap="round"
      opacity="0.6"
      fill="none"
    />
    <path
      d="M50 12 C90 8, 130 16, 170 10 C210 5, 250 14, 290 9 C330 4, 370 12, 400 8"
      stroke="white"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.5"
      fill="none"
    />
  </svg>
);

export function HeroAnimations() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="hero-animations-container"
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-hidden="true"
    >
      {/* Zirruswolken – höhere Opacity für Sichtbarkeit auf hellem Himmel */}
      <CirrusCloud delay={0}  duration={80} startY={6}  opacity={0.6} width={400} />
      <CirrusCloud delay={20} duration={95} startY={12} opacity={0.5} width={350} />
      <CirrusCloud delay={40} duration={70} startY={3}  opacity={0.55} width={380} />
      <CirrusCloud delay={55} duration={85} startY={16} opacity={0.45} width={300} />

      {/* Vögel - Gruppe 1: Nah */}
      <Bird delay={2}  duration={16} startY={25} size={1.2} />
      <Bird delay={4}  duration={18} startY={22} size={1.0} />

      {/* Gruppe 2: Mittel */}
      <Bird delay={8}  duration={14} startY={18} size={0.8} />
      <Bird delay={10} duration={15} startY={15} size={0.7} />
      <Bird delay={12} duration={16} startY={20} size={0.75} />

      {/* Gruppe 3: Fern */}
      <Bird delay={6}  duration={12} startY={12} size={0.5} />
      <Bird delay={14} duration={13} startY={10} size={0.45} />
      <Bird delay={18} duration={11} startY={8}  size={0.4} />
    </div>
  );
}
