import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';
import { cn } from '@/lib/utils';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OnboardingOverlay() {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    steps,
    nextStep,
    prevStep,
    skipOnboarding,
  } = useOnboarding();

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Find and measure target element
  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const element = document.querySelector(currentStep.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const padding = currentStep.spotlightPadding || 8;
        setTargetRect({
          top: rect.top - padding + window.scrollY,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });

        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Element not found, try again after a short delay
        setTimeout(findTarget, 100);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(findTarget, 100);
    return () => clearTimeout(timer);
  }, [isActive, currentStep]);

  // Calculate tooltip position
  useEffect(() => {
    if (!targetRect || !tooltipRef.current || !currentStep) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 16;

    let top = 0;
    let left = 0;

    switch (currentStep.position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - padding - window.scrollY;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = targetRect.top + targetRect.height + padding - window.scrollY;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2 - window.scrollY;
        left = targetRect.left - tooltipRect.width - padding;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2 - window.scrollY;
        left = targetRect.left + targetRect.width + padding;
        break;
      default:
        top = targetRect.top + targetRect.height + padding - window.scrollY;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
    }

    // Clamp to viewport
    left = Math.max(padding, Math.min(left, viewportWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipRect.height - padding));

    setTooltipPosition({ top, left });
  }, [targetRect, currentStep]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] pointer-events-auto"
      >
        {/* Dark overlay with spotlight cutout */}
        <svg className="absolute inset-0 w-full h-full" style={{ height: '200vh' }}>
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  x={targetRect.left}
                  y={targetRect.top}
                  width={targetRect.width}
                  height={targetRect.height}
                  rx="16"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight border glow */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute rounded-2xl pointer-events-none"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              boxShadow: '0 0 0 3px hsl(44, 98%, 49%), 0 0 20px 4px hsl(44, 98%, 49% / 0.4)',
            }}
          />
        )}

        {/* Tooltip */}
        {currentStep && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.2 }}
            className="fixed z-[201] w-[320px] max-w-[calc(100vw-32px)]"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
          >
            <div className="bg-card border border-border rounded-2xl shadow-strong overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-accent/10 to-primary/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    Schritt {currentStepIndex + 1} von {steps.length}
                  </span>
                </div>
                <button
                  onClick={skipOnboarding}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Tutorial überspringen"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {currentStep.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentStep.description}
                </p>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 pb-3">
                {steps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      index === currentStepIndex
                        ? 'w-6 bg-accent'
                        : index < currentStepIndex
                        ? 'w-1.5 bg-accent/50'
                        : 'w-1.5 bg-muted'
                    )}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between p-4 pt-0 gap-3">
                <button
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className={cn(
                    'flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                    currentStepIndex === 0
                      ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Zurück
                </button>

                <button
                  onClick={nextStep}
                  className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
                >
                  {currentStepIndex === steps.length - 1 ? (
                    'Fertig!'
                  ) : (
                    <>
                      Weiter
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Skip button (mobile-friendly) */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={skipOnboarding}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/70 text-sm font-medium hover:bg-white/20 transition-colors z-[202]"
        >
          Tutorial überspringen
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
