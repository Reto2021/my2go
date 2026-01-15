import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import { Star, Quote, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PartnerReview {
  id: string;
  author_name: string;
  author_photo_url: string | null;
  rating: number;
  text: string | null;
  relative_time_description: string | null;
  is_featured: boolean;
}

interface TestimonialCarouselProps {
  partnerId: string;
  className?: string;
  minRating?: number;
  showTitle?: boolean;
}

export function TestimonialCarousel({ 
  partnerId, 
  className,
  minRating = 4,
  showTitle = true
}: TestimonialCarouselProps) {
  const [reviews, setReviews] = useState<PartnerReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        // First try to fetch German reviews
        const { data: germanData, error: germanError } = await supabase
          .from('partner_reviews')
          .select('id, author_name, author_photo_url, rating, text, relative_time_description, is_featured')
          .eq('partner_id', partnerId)
          .eq('is_visible', true)
          .eq('language', 'de')
          .gte('rating', minRating)
          .order('is_featured', { ascending: false })
          .order('rating', { ascending: false })
          .order('review_time', { ascending: false })
          .limit(10);

        if (germanError) {
          console.error('Error fetching German reviews:', germanError);
        }

        // Filter reviews that have text content
        const germanReviews = (germanData || []).filter(r => r.text && r.text.trim().length > 10);

        // If we have German reviews, use them
        if (germanReviews.length > 0) {
          setReviews(germanReviews);
        } else {
          // Fallback: fetch all reviews regardless of language
          const { data: allData, error: allError } = await supabase
            .from('partner_reviews')
            .select('id, author_name, author_photo_url, rating, text, relative_time_description, is_featured')
            .eq('partner_id', partnerId)
            .eq('is_visible', true)
            .gte('rating', minRating)
            .order('is_featured', { ascending: false })
            .order('rating', { ascending: false })
            .order('review_time', { ascending: false })
            .limit(10);

          if (allError) {
            console.error('Error fetching reviews:', allError);
          } else {
            const allReviews = (allData || []).filter(r => r.text && r.text.trim().length > 10);
            setReviews(allReviews);
          }
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (partnerId) {
      fetchReviews();
    }
  }, [partnerId, minRating]);

  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-6 bg-muted rounded w-40 mb-4" />
        <div className="h-40 bg-muted/50 rounded-xl" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return null; // Don't show anything if no reviews
  }

  return (
    <div className={cn("relative", className)}>
      {showTitle && (
        <div className="flex items-center gap-2 mb-4">
          <Quote className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-bold">Kundenstimmen</h3>
          <span className="text-sm text-muted-foreground">({reviews.length})</span>
        </div>
      )}

      <Carousel
        opts={{
          align: "start",
          loop: reviews.length > 1,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {reviews.map((review, index) => (
            <CarouselItem key={review.id} className="pl-2 md:pl-4 basis-[85%] sm:basis-[70%] md:basis-1/2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TestimonialCard review={review} />
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {reviews.length > 1 && (
          <>
            <CarouselPrevious className="hidden sm:flex -left-4 bg-background/80 backdrop-blur-sm border-border/50" />
            <CarouselNext className="hidden sm:flex -right-4 bg-background/80 backdrop-blur-sm border-border/50" />
          </>
        )}
      </Carousel>

      {/* Mobile scroll indicator */}
      {reviews.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4 sm:hidden">
          {reviews.slice(0, Math.min(reviews.length, 5)).map((_, i) => (
            <div 
              key={i} 
              className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TestimonialCard({ review }: { review: PartnerReview }) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 150;
  const isLong = (review.text?.length || 0) > maxLength;
  const displayText = expanded || !isLong 
    ? review.text 
    : `${review.text?.substring(0, maxLength)}...`;

  return (
    <div className="relative h-full">
      {/* Featured badge */}
      {review.is_featured && (
        <div className="absolute -top-2 -right-2 z-10">
          <span className="px-2 py-0.5 text-xs font-semibold bg-accent text-accent-foreground rounded-full">
            ⭐ Top
          </span>
        </div>
      )}

      <div className="card-base p-4 h-full flex flex-col bg-gradient-to-br from-background to-muted/30">
        {/* Quote icon */}
        <div className="absolute top-3 right-3 opacity-10">
          <Quote className="h-8 w-8 text-foreground" />
        </div>

        {/* Header with author and rating */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {review.author_photo_url ? (
              <img 
                src={review.author_photo_url} 
                alt={review.author_name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-background"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-background">
                <User className="h-5 w-5 text-secondary" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{review.author_name}</p>
            <div className="flex items-center gap-2">
              {/* Star rating */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={cn(
                      "h-3.5 w-3.5",
                      i < review.rating 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "fill-muted text-muted"
                    )} 
                  />
                ))}
              </div>
              {review.relative_time_description && (
                <span className="text-xs text-muted-foreground">
                  · {review.relative_time_description}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Review text */}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            "{displayText}"
          </p>
          {isLong && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-accent font-medium mt-1 hover:underline"
            >
              {expanded ? 'Weniger' : 'Mehr lesen'}
            </button>
          )}
        </div>

        {/* Google attribution */}
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5">
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-xs text-muted-foreground">Google Bewertung</span>
        </div>
      </div>
    </div>
  );
}

export default TestimonialCarousel;
