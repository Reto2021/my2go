import { forwardRef } from 'react';
import { Gift, Radio } from 'lucide-react';
import talerCoin from '@/assets/taler-coin.png';
import logoRadio2go from '@/assets/logo-radio2go.png';

interface InstagramShareCardProps {
  rewardTitle: string;
  partnerName: string;
  partnerLogo?: string | null;
  savedAmount?: number | null;
  savedPercent?: number | null;
  talerSpent: number;
  isRedeemed: boolean;
}

export const InstagramShareCard = forwardRef<HTMLDivElement, InstagramShareCardProps>(
  ({ rewardTitle, partnerName, partnerLogo, savedAmount, savedPercent, talerSpent, isRedeemed }, ref) => {
    const getSavingsText = () => {
      if (savedAmount) return `${savedAmount}€ gespart`;
      if (savedPercent) return `${savedPercent}% Rabatt`;
      return null;
    };

    const savingsText = getSavingsText();

    return (
      <div
        ref={ref}
        className="w-[360px] h-[640px] relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, hsl(200 50% 66%) 0%, hsl(200 55% 75%) 40%, hsl(200 60% 85%) 100%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating coins */}
          <div className="absolute top-12 left-6 w-10 h-10 animate-pulse opacity-60">
            <img src={talerCoin} alt="" className="w-full h-full" />
          </div>
          <div className="absolute top-32 right-8 w-8 h-8 animate-pulse opacity-50" style={{ animationDelay: '0.5s' }}>
            <img src={talerCoin} alt="" className="w-full h-full" />
          </div>
          <div className="absolute top-64 left-10 w-6 h-6 animate-pulse opacity-40" style={{ animationDelay: '1s' }}>
            <img src={talerCoin} alt="" className="w-full h-full" />
          </div>
          <div className="absolute bottom-48 right-12 w-8 h-8 animate-pulse opacity-50" style={{ animationDelay: '0.3s' }}>
            <img src={talerCoin} alt="" className="w-full h-full" />
          </div>
          
          {/* Abstract shapes */}
          <div 
            className="absolute top-20 right-4 w-24 h-24 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, hsl(44 98% 49% / 0.6) 0%, transparent 70%)' }}
          />
          <div 
            className="absolute bottom-32 left-4 w-32 h-32 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, hsl(197 96% 18% / 0.4) 0%, transparent 70%)' }}
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 py-12">
          {/* Logo */}
          <div className="mb-6">
            <img src={logoRadio2go} alt="Radio 2Go" className="h-10 object-contain" />
          </div>

          {/* Status Badge */}
          <div 
            className="px-4 py-2 rounded-full mb-6"
            style={{ 
              background: isRedeemed 
                ? 'linear-gradient(135deg, hsl(160 84% 39%) 0%, hsl(160 84% 30%) 100%)' 
                : 'linear-gradient(135deg, hsl(44 98% 49%) 0%, hsl(40 98% 40%) 100%)',
              color: isRedeemed ? 'white' : 'hsl(197 96% 12%)',
            }}
          >
            <span className="font-bold text-sm uppercase tracking-wide">
              {isRedeemed ? '✓ Eingelöst!' : '🎁 Mein Gutschein'}
            </span>
          </div>

          {/* Partner Card */}
          <div 
            className="w-full rounded-3xl p-6 mb-6"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 40px rgba(2, 63, 90, 0.2)',
            }}
          >
            {/* Partner Logo & Name */}
            <div className="flex items-center gap-4 mb-4">
              {partnerLogo ? (
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={partnerLogo} alt={partnerName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, hsl(200 50% 66%) 0%, hsl(200 55% 75%) 100%)' }}
                >
                  <Gift className="w-7 h-7 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 font-medium">Bei</p>
                <p className="text-lg font-bold text-gray-900 truncate">{partnerName}</p>
              </div>
            </div>

            {/* Reward Title */}
            <h2 
              className="text-xl font-bold mb-4 leading-tight"
              style={{ color: 'hsl(197 96% 18%)' }}
            >
              {rewardTitle}
            </h2>

            {/* Savings Badge */}
            {savingsText && (
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ 
                  background: 'linear-gradient(135deg, hsl(44 98% 49% / 0.2) 0%, hsl(44 98% 49% / 0.3) 100%)',
                  border: '2px solid hsl(44 98% 49%)',
                }}
              >
                <span className="text-2xl">💰</span>
                <span 
                  className="font-bold text-lg"
                  style={{ color: 'hsl(197 96% 18%)' }}
                >
                  {savingsText}
                </span>
              </div>
            )}
          </div>

          {/* Taler Info */}
          <div 
            className="flex items-center gap-3 px-5 py-3 rounded-2xl mb-8"
            style={{ background: 'rgba(255, 255, 255, 0.7)' }}
          >
            <img src={talerCoin} alt="Taler" className="w-8 h-8" />
            <span 
              className="font-bold text-lg"
              style={{ color: 'hsl(197 96% 18%)' }}
            >
              {talerSpent} Taler eingesetzt
            </span>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-white font-semibold text-base mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              Auch sparen? Hol dir die App!
            </p>
            <div 
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl"
              style={{ 
                background: 'hsl(197 96% 18%)',
                color: 'white',
              }}
            >
              <Radio className="w-5 h-5" />
              <span className="font-bold">radio2go.fm</span>
            </div>
          </div>
        </div>

        {/* Bottom Skyline */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-20"
          style={{
            background: 'linear-gradient(to top, hsl(197 96% 18% / 0.8), hsl(197 96% 18% / 0.4), transparent)',
          }}
        />
      </div>
    );
  }
);

InstagramShareCard.displayName = 'InstagramShareCard';
