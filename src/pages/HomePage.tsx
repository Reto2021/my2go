import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/lib/location';
import { getRewards, getPartnersWithMinRewardCost, Reward, PartnerWithMinCost } from '@/lib/supabase-helpers';
import { prefetchCommonRoutes } from '@/lib/route-prefetch';
import { DancePartySheet } from '@/components/video/DancePartySheet';
import { LocationPermissionPrompt } from '@/components/location/LocationPermissionPrompt';

// Extracted components
import { 
  BrowseModeHome, 
  SessionModeHome, 
  HomePageSkeleton, 
  calculateDistance 
} from './home';

// Prefetch common routes after initial load
if (typeof window !== 'undefined') {
  prefetchCommonRoutes();
}

export default function HomePage() {
  const { user, profile, balance, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    userLocation, 
    isRequestingLocation, 
    locationPermissionGranted,
    promptDismissedThisSession,
    requestLocation, 
    clearLocation,
    dismissPromptForSession,
    initFromStorage,
  } = useLocation();
  
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [partners, setPartners] = useState<PartnerWithMinCost[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  
  // Dance Party from URL
  const [dancePartyRoom, setDancePartyRoom] = useState<string | null>(null);
  const [showDanceParty, setShowDanceParty] = useState(false);
  
  const isAuthenticated = !!user;
  
  const [locationInitialized, setLocationInitialized] = useState(false);
  
  // Check for dance party invite link
  useEffect(() => {
    const danceParam = searchParams.get('dance');
    if (danceParam) {
      setDancePartyRoom(danceParam);
      setShowDanceParty(true);
      searchParams.delete('dance');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  // Initialize location from storage on mount
  useEffect(() => {
    initFromStorage();
    setLocationInitialized(true);
  }, []);
  
  // Show location prompt if not granted and not dismissed this session
  useEffect(() => {
    if (!locationInitialized) return;
    
    if (!isLoading && isAuthenticated && !locationPermissionGranted && !promptDismissedThisSession) {
      const timer = setTimeout(() => setShowLocationPrompt(true), 500);
      return () => clearTimeout(timer);
    }
  }, [locationInitialized, isLoading, isAuthenticated, locationPermissionGranted, promptDismissedThisSession]);
  
  // Load content from Supabase
  useEffect(() => {
    async function loadContent() {
      setIsLoadingContent(true);
      try {
        const [rewardsData, partnersData] = await Promise.all([
          getRewards(),
          getPartnersWithMinRewardCost(),
        ]);
        
        // Sort by distance if user location is available
        let sortedRewards = rewardsData;
        if (userLocation && rewardsData.length > 0) {
          sortedRewards = rewardsData
            .map(reward => {
              const partner = reward.partner;
              if (partner?.lat && partner?.lng) {
                const distance = calculateDistance(
                  userLocation.lat, 
                  userLocation.lng, 
                  partner.lat, 
                  partner.lng
                );
                return { ...reward, distanceKm: distance };
              }
              return { ...reward, distanceKm: 9999 };
            })
            .sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999));
        }
        
        setRewards(sortedRewards.slice(0, 4));
        setPartners(partnersData.slice(0, 3));
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setIsLoadingContent(false);
      }
    }
    loadContent();
  }, [userLocation]);
  
  const handleAllowLocation = async () => {
    setShowLocationPrompt(false);
    await requestLocation();
  };
  
  const handleDenyLocation = () => {
    setShowLocationPrompt(false);
    dismissPromptForSession();
  };
  
  const handleLogin = () => {
    navigate('/auth');
  };
  
  if (isLoading) {
    return <HomePageSkeleton />;
  }
  
  if (!isAuthenticated) {
    return (
      <BrowseModeHome 
        rewards={rewards} 
        partners={partners} 
        isLoading={isLoadingContent} 
        onLogin={handleLogin} 
      />
    );
  }
  
  return (
    <>
      {/* Location Permission Prompt */}
      <LocationPermissionPrompt
        isOpen={showLocationPrompt}
        isRequesting={isRequestingLocation}
        onAllow={handleAllowLocation}
        onDeny={handleDenyLocation}
      />
      
      <SessionModeHome 
        displayName={profile?.display_name || profile?.first_name}
        userId={user?.id}
        balance={balance || { taler_balance: 0, lifetime_earned: 0, lifetime_spent: 0 }}
        rewards={rewards}
        isLoading={isLoadingContent}
        userLocation={userLocation}
        onClearLocation={clearLocation}
        onRequestLocation={requestLocation}
        isRequestingLocation={isRequestingLocation}
      />
      
      {/* Dance Party from invite link */}
      {dancePartyRoom && (
        <DancePartySheet
          open={showDanceParty}
          onOpenChange={setShowDanceParty}
          songIdentifier={dancePartyRoom}
          songTitle="Dance Party Einladung"
        />
      )}
    </>
  );
}
