import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ExternalLink, X, MessageSquare, Send, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReviewRequestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  partnerName: string;
  redemptionId?: string;
  googlePlaceId?: string | null;
}

export function ReviewRequestSheet({
  isOpen,
  onClose,
  partnerId,
  partnerName,
  redemptionId,
  googlePlaceId
}: ReviewRequestSheetProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewRequestId, setReviewRequestId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setRating(null);
      setShowFeedback(false);
      setFeedbackText('');
      setHasSubmitted(false);
      setReviewRequestId(null);
    }
  }, [isOpen]);

  const handleRatingSelect = async (selectedRating: number) => {
    setRating(selectedRating);
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create review request
      const { data, error } = await supabase
        .from('review_requests')
        .insert({
          user_id: user.id,
          partner_id: partnerId,
          redemption_id: redemptionId || null,
          in_app_rating: selectedRating,
        })
        .select('id')
        .single();

      if (error) throw error;
      setReviewRequestId(data.id);

      if (selectedRating >= 4) {
        // Show Google Review prompt for positive ratings
        setShowFeedback(false);
      } else {
        // Show feedback form for negative ratings
        setShowFeedback(true);
      }
    } catch (error) {
      console.error('Failed to save rating:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleReviewClick = async () => {
    if (!reviewRequestId) return;

    try {
      // Track that user clicked the Google Review button
      await supabase
        .from('review_requests')
        .update({
          review_clicked: true,
          review_clicked_at: new Date().toISOString(),
        })
        .eq('id', reviewRequestId);

      // Award bonus Taler via RPC
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: bonusResult, error: bonusError } = await supabase.rpc('award_review_bonus', {
          _user_id: user.id,
          _review_request_id: reviewRequestId,
        });

        const result = bonusResult as { success?: boolean; bonus?: number } | null;
        if (!bonusError && result?.success) {
          toast.success(`+${result.bonus} Taler für dein Feedback!`, {
            icon: <Gift className="h-4 w-4 text-accent" />
          });
        }
      }

      // Open Google Review
      if (googlePlaceId) {
        window.open(
          `https://search.google.com/local/writereview?placeid=${googlePlaceId}`,
          '_blank'
        );
      }

      setHasSubmitted(true);
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error('Failed to track review click:', error);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!reviewRequestId || !feedbackText.trim()) return;

    setIsSubmitting(true);
    try {
      await supabase
        .from('review_requests')
        .update({
          feedback_text: feedbackText.trim(),
          feedback_submitted_at: new Date().toISOString(),
        })
        .eq('id', reviewRequestId);

      // Award bonus Taler for feedback too
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: bonusResult, error: bonusError } = await supabase.rpc('award_review_bonus', {
          _user_id: user.id,
          _review_request_id: reviewRequestId,
        });

        const result = bonusResult as { success?: boolean; bonus?: number } | null;
        if (!bonusError && result?.success) {
          toast.success(`Danke für dein Feedback! +${result.bonus} Taler`, {
            description: 'Wir leiten es an den Partner weiter.'
          });
        } else {
          toast.success('Danke für dein Feedback!', {
            description: 'Wir leiten es an den Partner weiter.'
          });
        }
      }

      setHasSubmitted(true);
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Fehler beim Senden');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-background rounded-t-3xl p-6 pb-safe max-h-[85vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>

            {hasSubmitted ? (
              /* Thank you state */
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-accent fill-accent" />
                </div>
                <h2 className="text-xl font-bold mb-2">Vielen Dank!</h2>
                <p className="text-muted-foreground">
                  Dein Feedback hilft uns und unseren Partnern.
                </p>
              </motion.div>
            ) : !rating ? (
              /* Rating selection */
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">
                  Wie war dein Erlebnis bei {partnerName}?
                </h2>
                <p className="text-muted-foreground mb-8">
                  Dein Feedback hilft anderen Nutzern
                </p>

                <div className="flex justify-center gap-2 mb-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingSelect(star)}
                      disabled={isSubmitting}
                      className="p-2 transition-transform hover:scale-110 disabled:opacity-50"
                    >
                      <Star
                        className="h-10 w-10 text-muted-foreground/30 transition-colors hover:text-accent hover:fill-accent"
                      />
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSkip}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Überspringen
                </button>
              </div>
            ) : rating >= 4 ? (
              /* Positive rating - Google Review prompt */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${
                        star <= rating
                          ? 'text-accent fill-accent'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>

                <h2 className="text-xl font-bold mb-2">
                  Freut uns, dass es dir gefallen hat!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Teile deine Erfahrung auf Google und hilf anderen,
                  tolle lokale Angebote zu entdecken.
                </p>

                {googlePlaceId ? (
                  <Button
                    onClick={handleGoogleReviewClick}
                    className="w-full mb-4"
                    size="lg"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Auf Google bewerten
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    Google-Bewertung ist für diesen Partner noch nicht verfügbar.
                  </p>
                )}

                <button
                  onClick={onClose}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Vielleicht später
                </button>
              </motion.div>
            ) : (
              /* Negative rating - Feedback form */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${
                        star <= (rating || 0)
                          ? 'text-accent fill-accent'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>

                <h2 className="text-xl font-bold mb-2 text-center">
                  Das tut uns leid!
                </h2>
                <p className="text-muted-foreground mb-6 text-center">
                  Was können wir verbessern? Dein Feedback wird anonym an den Partner weitergeleitet.
                </p>

                <div className="space-y-4">
                  <Textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Erzähl uns, was passiert ist..."
                    className="min-h-[120px]"
                  />

                  <Button
                    onClick={handleFeedbackSubmit}
                    disabled={!feedbackText.trim() || isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Feedback senden
                  </Button>

                  <button
                    onClick={onClose}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    Überspringen
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
