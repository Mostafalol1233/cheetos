import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { API_BASE_URL } from "@/lib/queryClient";

interface Review {
  id: number;
  game_slug: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: number;
}

const STATIC_REVIEWS: Review[] = [
  { id: -1, game_slug: 'free-fire', user_name: 'احمد محمد', rating: 5, comment: 'والله عم ضياء عم الدنيا كلها، شحنت free fire وجات في ثواني مش بتصدق', created_at: Date.now() },
  { id: -2, game_slug: 'pubg-mobile', user_name: 'Omar Hassan', rating: 5, comment: 'Got my PUBG UC instantly! Super fast and no issues at all.', created_at: Date.now() },
  { id: -3, game_slug: 'spotify-gift-card', user_name: 'نور ابراهيم', rating: 5, comment: 'spotify جاني في دقيقه وشغلته علطول، سعر تمام والخدمه احسن', created_at: Date.now() },
  { id: -4, game_slug: 'valorant', user_name: 'Karim Adel', rating: 5, comment: 'Valorant Points delivered in seconds. Really happy with this!', created_at: Date.now() },
  { id: -5, game_slug: 'discord-nitro', user_name: 'مصطفي سامي', rating: 5, comment: 'discord nitro جاني في اقل من دقيقه وبسعر اوفر من اي مكان تاني', created_at: Date.now() },
  { id: -6, game_slug: 'roblox', user_name: 'Sara Mohamed', rating: 5, comment: 'Bought Robux for my kids and they got it instantly. Will come back for sure!', created_at: Date.now() },
  { id: -7, game_slug: 'free-fire', user_name: 'هشام علي', rating: 5, comment: 'الراجل ده امين ومضمون، بشحن free fire من هنا من زمان وما تعبتش', created_at: Date.now() },
  { id: -8, game_slug: 'minecraft', user_name: 'Ziad Ahmed', rating: 4, comment: 'Great prices on Minecraft coins and delivery was really fast!', created_at: Date.now() },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const initial = review.user_name.charAt(0).toUpperCase();
  return (
    <div className="flex-shrink-0 w-72 mx-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-gold-primary/30 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-primary to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{review.user_name}</p>
          <StarRating rating={review.rating} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{review.comment}</p>
    </div>
  );
}

export function ReviewsMarquee() {
  const { data: dbReviews = [] } = useQuery<Review[]>({
    queryKey: ['home-reviews-marquee'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reviews/recent?limit=20`);
        if (!res.ok) return [];
        return res.json();
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const allReviews = [...(dbReviews.length > 0 ? dbReviews : []), ...STATIC_REVIEWS];
  const doubled = [...allReviews, ...allReviews];

  return (
    <div className="overflow-hidden relative py-2" aria-label="Customer reviews">
      <div className="flex animate-scroll-reviews">
        {doubled.map((review, i) => (
          <ReviewCard key={`${review.id}-${i}`} review={review} />
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
    </div>
  );
}
