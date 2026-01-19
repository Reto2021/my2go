import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ArrowLeft, User, Mail, MapPin, Loader2, Save, Check, AlertCircle, CheckCircle } from 'lucide-react';
import { Skeleton, SkeletonProfile } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { Button } from '@/components/ui/button';
import { TalerPlusStats } from '@/components/profile/TalerPlusStats';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const profileSchema = z.object({
  display_name: z.string().trim().max(100, 'Max 100 Zeichen').optional(),
  first_name: z.string().trim().max(50, 'Max 50 Zeichen').optional(),
  last_name: z.string().trim().max(50, 'Max 50 Zeichen').optional(),
  phone: z.string().trim().regex(/^\+?[1-9]\d{6,14}$/, 'Ungültige Telefonnummer (z.B. +41791234567 oder +4915123456789)').optional().or(z.literal('')),
  postal_code: z.string().trim().max(10, 'Max 10 Zeichen').optional(),
  city: z.string().trim().max(100, 'Max 100 Zeichen').optional(),
  leaderboard_nickname: z.string().trim().max(20, 'Max 20 Zeichen').optional(),
});

const emailSchema = z.string().trim().email('Ungültige E-Mail-Adresse');

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, isLoading: isAuthLoading } = useAuth();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: '',
    first_name: '',
    last_name: '',
    phone: '',
    postal_code: '',
    city: '',
    leaderboard_nickname: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Email change state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Load profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        postal_code: profile.postal_code || '',
        city: profile.city || '',
        leaderboard_nickname: profile.leaderboard_nickname || '',
      });
    }
  }, [profile]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setHasChanges(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ProfileFormData, string>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof ProfileFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Clean up empty strings to null
      const cleanedData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
      );
      
      const { error } = await updateProfile(user.id, cleanedData);
      
      if (error) {
        toast.error('Fehler beim Speichern');
        return;
      }
      
      await refreshProfile();
      toast.success('Profil gespeichert');
      setHasChanges(false);
    } catch (error) {
      toast.error('Fehler beim Speichern');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEmailChange = async () => {
    setEmailError(null);
    
    // Validate email
    const result = emailSchema.safeParse(newEmail);
    if (!result.success) {
      setEmailError(result.error.errors[0].message);
      return;
    }
    
    // Check if same as current
    if (newEmail.toLowerCase() === user?.email?.toLowerCase()) {
      setEmailError('Das ist bereits deine aktuelle E-Mail-Adresse');
      return;
    }
    
    setIsEmailLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      }, {
        emailRedirectTo: `${window.location.origin}/profile`,
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          setEmailError('Diese E-Mail-Adresse wird bereits verwendet');
        } else {
          setEmailError(error.message);
        }
        return;
      }
      
      setEmailSent(true);
      toast.success('Bestätigungs-E-Mail gesendet!');
    } catch (error) {
      setEmailError('Ein Fehler ist aufgetreten');
    } finally {
      setIsEmailLoading(false);
    }
  };
  
  const closeEmailDialog = () => {
    setShowEmailDialog(false);
    setNewEmail('');
    setEmailError(null);
    setEmailSent(false);
  };
  
  if (!user) return null;
  
  // Show skeleton while auth is loading
  if (isAuthLoading) {
    return <ProfilePageSkeleton />;
  }
  
  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Mein Profil</h1>
        </div>
      </header>
      
      <div className="container py-6 space-y-6">
        {/* Avatar Section */}
        <section className="animate-in">
          {user && (
            <AvatarUpload
              userId={user.id}
              currentAvatarUrl={profile?.avatar_url || null}
              displayName={formData.display_name || formData.first_name || profile?.email || 'U'}
              onAvatarUpdated={refreshProfile}
            />
          )}
          <p className="text-sm text-muted-foreground mt-3 text-center">{profile?.email}</p>
        </section>
        
        {/* Email Change Section */}
        <section className="animate-in">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            E-Mail-Adresse
          </h2>
          
          <div className="card-base p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{user.email}</p>
                <p className="text-sm text-muted-foreground">Deine Anmelde-E-Mail</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmailDialog(true)}
              >
                Ändern
              </Button>
            </div>
          </div>
        </section>
        
        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6 animate-in-delayed">
          {/* Personal Info Section */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Persönliche Daten
            </h2>
            
            <div className="card-base p-4 space-y-4">
              {/* Display Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Anzeigename</label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => handleChange('display_name', e.target.value)}
                  placeholder="Dein öffentlicher Name"
                  maxLength={100}
                  className={cn(errors.display_name && 'border-destructive')}
                />
                {errors.display_name && (
                  <p className="text-sm text-destructive">{errors.display_name}</p>
                )}
              </div>
              
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vorname</label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder="Max"
                    maxLength={50}
                    className={cn(errors.first_name && 'border-destructive')}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">{errors.first_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nachname</label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    placeholder="Muster"
                    maxLength={50}
                    className={cn(errors.last_name && 'border-destructive')}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">{errors.last_name}</p>
                  )}
                </div>
              </div>
              
              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefon</label>
                <PhoneInput
                  value={formData.phone || ''}
                  onChange={(val) => handleChange('phone', val)}
                  error={!!errors.phone}
                  placeholder="79 123 45 67"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>
          </section>
          
          {/* Location Section */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Adresse
            </h2>
            
            <div className="card-base p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">PLZ</label>
                  <Input
                    value={formData.postal_code}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                    placeholder="8000"
                    maxLength={10}
                    className={cn(errors.postal_code && 'border-destructive')}
                  />
                  {errors.postal_code && (
                    <p className="text-sm text-destructive">{errors.postal_code}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ort</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Zürich"
                    maxLength={100}
                    className={cn(errors.city && 'border-destructive')}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
          
          {/* Leaderboard Section */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              🏆 Leaderboard
            </h2>
            
            <div className="card-base p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nickname</label>
                <Input
                  value={formData.leaderboard_nickname}
                  onChange={(e) => handleChange('leaderboard_nickname', e.target.value)}
                  placeholder="TalerKing2024"
                  maxLength={20}
                  className={cn(errors.leaderboard_nickname && 'border-destructive')}
                />
                <p className="text-xs text-muted-foreground">
                  Wird öffentlich im Leaderboard angezeigt (max. 20 Zeichen)
                </p>
                {errors.leaderboard_nickname && (
                  <p className="text-sm text-destructive">{errors.leaderboard_nickname}</p>
                )}
              </div>
            </div>
          </section>
          
          {/* Save Button */}
          <Button
            type="submit"
            disabled={isLoading || !hasChanges}
            className="w-full h-14 text-base"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : hasChanges ? (
              <>
                <Save className="h-5 w-5 mr-2" />
                Änderungen speichern
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Gespeichert
              </>
            )}
          </Button>
        </form>
        
        {/* Taler-Plus Stats */}
        <TalerPlusStats />
        
        {/* Info */}
        <section className="animate-in-delayed">
          <div className="p-4 rounded-2xl bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              Deine Daten werden sicher gespeichert und nicht an Dritte weitergegeben.
            </p>
          </div>
        </section>
      </div>
      
      {/* Email Change Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>E-Mail-Adresse ändern</DialogTitle>
            <DialogDescription>
              {emailSent 
                ? 'Wir haben dir eine Bestätigungs-E-Mail gesendet.'
                : 'Gib deine neue E-Mail-Adresse ein. Du erhältst eine Bestätigungs-E-Mail.'}
            </DialogDescription>
          </DialogHeader>
          
          {emailSent ? (
            <div className="py-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <p className="font-medium text-foreground mb-2">
                  Bestätigungs-E-Mail gesendet!
                </p>
                <p className="text-sm text-muted-foreground">
                  Wir haben eine E-Mail an <strong>{newEmail}</strong> gesendet. 
                  Klicke auf den Link in der E-Mail, um deine neue Adresse zu bestätigen.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Aktuelle E-Mail</label>
                <Input
                  value={user.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Neue E-Mail</label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setEmailError(null);
                  }}
                  placeholder="neue@email.ch"
                  className={cn(emailError && 'border-destructive')}
                  autoComplete="email"
                />
                {emailError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {emailError}
                  </p>
                )}
              </div>
              
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-700">
                  <strong>Hinweis:</strong> Nach der Bestätigung musst du dich mit der neuen E-Mail-Adresse anmelden.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {emailSent ? (
              <Button onClick={closeEmailDialog} className="w-full">
                Verstanden
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={closeEmailDialog}
                  disabled={isEmailLoading}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleEmailChange}
                  disabled={isEmailLoading || !newEmail}
                >
                  {isEmailLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Bestätigung senden
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Full-page skeleton for ProfilePage loading
 */
function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-5 w-24 rounded" />
        </div>
      </header>
      
      <div className="container py-6 space-y-6">
        {/* Avatar Section */}
        <SkeletonProfile />
        
        {/* Email Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <div className="card-base p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        </section>
        
        {/* Personal Info Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <div className="card-base p-4 space-y-4">
            {/* Display name */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            {/* First & Last name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
            {/* Phone */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </section>
        
        {/* Address Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="card-base p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-8 rounded" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-8 rounded" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </section>
        
        {/* Save Button */}
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    </div>
  );
}