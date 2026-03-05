import { RefObject } from "react";
import { motion, MotionValue, animate, PanInfo } from "framer-motion";
import { Flame, Play, ChevronRight, Radio, Loader2 } from "lucide-react";

interface SliderStateProps {
  containerRef: RefObject<HTMLDivElement>;
  x: MotionValue<number>;
  sliderWidth: RefObject<number>;
  sliderProgress: number;
  hasBonusAvailable: boolean;
  nextBonus: number;
  currentStreak: number;
  isClaiming: boolean;
  isRadioLoading: boolean;
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
}

export function SliderState({
  containerRef,
  x,
  sliderWidth,
  sliderProgress,
  hasBonusAvailable,
  nextBonus,
  currentStreak,
  isClaiming,
  isRadioLoading,
  onDragEnd,
}: SliderStateProps) {
  return (
    <motion.div
      key="slider"
      initial={{ y: 20, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        boxShadow: hasBonusAvailable
          ? [
              "0 4px 25px rgba(0,0,0,0.25), 0 0 0 0 rgba(255, 170, 0, 0.3)",
              "0 4px 25px rgba(0,0,0,0.25), 0 0 8px 4px rgba(255, 170, 0, 0)",
              "0 4px 25px rgba(0,0,0,0.25), 0 0 0 0 rgba(255, 170, 0, 0.3)",
            ]
          : "0 4px 25px rgba(0,0,0,0.25)",
      }}
      exit={{ y: 20, opacity: 0 }}
      transition={{
        y: { duration: 0.3 },
        opacity: { duration: 0.3 },
        boxShadow: hasBonusAvailable
          ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.3 },
      }}
      className="rounded-2xl bg-secondary shadow-strong overflow-hidden relative"
    >
      {/* Shine effect - only when bonus available */}
      {hasBonusAvailable && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20"
          initial={false}
        >
          <motion.div
            className="absolute inset-y-0 w-24 -skew-x-12"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
            }}
            animate={{ x: ["-100%", "400%"] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      )}

      <div className="p-2.5">
        <div
          ref={containerRef}
          className="relative h-14 rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {/* Soft spotlight */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
            style={{ zIndex: 10 }}
          >
            <motion.div
              className="absolute"
              style={{
                width: 100,
                height: 100,
                top: "50%",
                marginTop: -50,
                background:
                  "radial-gradient(circle, rgba(122, 184, 214, 0.45) 0%, rgba(122, 184, 214, 0.2) 45%, transparent 70%)",
                filter: "blur(10px)",
              }}
              animate={{
                x: [-50, 300],
                opacity: [0, 0.7, 0.9, 0.7, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 2,
              }}
            />
          </div>

          {/* Track glow */}
          <motion.div
            className="absolute inset-y-1 left-1 bg-gradient-to-r from-accent/25 to-transparent rounded-lg"
            style={{
              width: `${Math.max(56, sliderProgress * 85)}%`,
              opacity: 0.5 + sliderProgress * 0.5,
            }}
          />

          {/* Center text */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: 1 - sliderProgress * 1.5 }}
          >
            {hasBonusAvailable ? (
              <div className="flex items-center gap-2 text-secondary-foreground/80">
                <span className="text-sm font-semibold tracking-wide">
                  Slide für +{nextBonus} Taler
                </span>
                <motion.div
                  animate={{ x: [0, 6, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.div>
              </div>
            ) : (
              <div className="w-full pl-16 pr-20 flex items-center justify-center">
                <motion.div
                  className="text-center leading-tight text-secondary-foreground/80"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="text-sm font-semibold tracking-wide">Zum Start nach rechts ziehen</div>
                  <div className="text-[11px] font-medium opacity-85">2Go-Taler sammeln</div>
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* Right side badge */}
          <div className="absolute right-1.5 top-1 bottom-1 flex items-center pointer-events-none">
            <motion.div
              className="px-3 py-1.5 rounded-lg font-bold text-secondary flex items-center gap-1.5"
              animate={{
                scale: hasBonusAvailable ? 1 + sliderProgress * 0.12 : 1,
              }}
              style={{
                background: `linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(38 95% 45%) 100%)`,
                boxShadow:
                  hasBonusAvailable && sliderProgress > 0.5
                    ? `0 0 ${12 + sliderProgress * 12}px hsl(44 98% 49% / ${0.4 + sliderProgress * 0.3})`
                    : "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              {hasBonusAvailable ? (
                <>
                  <Flame className="h-3.5 w-3.5" />
                  <span className="text-sm font-bold">+{nextBonus}</span>
                </>
              ) : currentStreak > 0 ? (
                <>
                  <Flame className="h-3.5 w-3.5" />
                  <span className="text-sm font-bold">{currentStreak}</span>
                </>
              ) : (
                <Radio className="h-4 w-4" />
              )}
            </motion.div>
          </div>

          {/* Draggable handle */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: sliderWidth.current }}
            dragElastic={0.05}
            onDragEnd={onDragEnd}
            style={{ x }}
            whileDrag={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="absolute left-1 top-1 bottom-1 w-14 cursor-grab active:cursor-grabbing z-10"
          >
            <div
              className="w-full h-full rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(38 95% 45%) 100%)",
                boxShadow:
                  "0 2px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              {isClaiming || isRadioLoading ? (
                <Loader2 className="h-5 w-5 text-secondary animate-spin" />
              ) : (
                <Play className="h-5 w-5 text-secondary fill-secondary" />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
