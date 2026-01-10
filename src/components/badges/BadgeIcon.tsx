import { 
  Award, 
  Coins, 
  Trophy, 
  Crown, 
  Gift, 
  ShoppingBag, 
  ShoppingCart, 
  Star, 
  UserPlus, 
  Users, 
  Megaphone,
  LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  award: Award,
  coins: Coins,
  trophy: Trophy,
  crown: Crown,
  gift: Gift,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  star: Star,
  'user-plus': UserPlus,
  users: Users,
  megaphone: Megaphone,
};

interface BadgeIconProps {
  icon: string;
  color: string;
  size?: "sm" | "md" | "lg";
  earned?: boolean;
}

export function BadgeIcon({ icon, color, size = "md", earned = true }: BadgeIconProps) {
  const Icon = iconMap[icon] || Award;
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };
  
  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${
        earned 
          ? "shadow-lg" 
          : "opacity-30 grayscale"
      }`}
      style={{ 
        backgroundColor: earned ? color : "#9CA3AF",
        boxShadow: earned ? `0 4px 14px ${color}40` : "none"
      }}
    >
      <Icon 
        size={iconSizes[size]} 
        className="text-white drop-shadow-sm" 
      />
    </div>
  );
}
