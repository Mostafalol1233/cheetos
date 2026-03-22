import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, CheckCircle, XCircle, Star, Mail, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/queryClient';

interface Review {
  id: number;
  game_slug: string;
  user_name: string;
  user_email: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: number;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
        />
      ))}
    </div>
  );
}

export function ReviewsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    }
  });

  const toggleApprovalMutation = useMutation({
    mutationFn: async ({ id, is_approved }: { id: number; is_approved: boolean }) => {
      const res = await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_approved })
      });
      if (!res.ok) throw new Error('Failed to update review');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({ title: 'Review deleted' });
    }
  });

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email).then(() => {
      toast({ title: 'Email copied!', description: email });
    });
  };

  const approved = reviews.filter(r => r.is_approved);
  const pending = reviews.filter(r => !r.is_approved);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reviews & Ratings</h2>
        <p className="text-sm text-muted-foreground">Moderate customer reviews across all products</p>
      </div>

      <div className="flex gap-4 text-sm flex-wrap">
        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full">✓ Approved: {approved.length}</span>
        <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">⏳ Pending: {pending.length}</span>
        <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full">Total: {reviews.length}</span>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No reviews yet. They'll appear here when customers leave feedback.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...pending, ...approved].map((review) => (
            <Card key={review.id} className={`border-border/40 ${!review.is_approved ? 'border-yellow-500/40 bg-yellow-500/5' : ''}`}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-semibold text-foreground">{review.user_name}</span>
                      <Badge variant="outline" className="text-xs">{review.game_slug}</Badge>
                      <Badge variant={review.is_approved ? 'default' : 'secondary'} className="text-xs">
                        {review.is_approved ? 'Approved' : 'Pending'}
                      </Badge>
                      <StarDisplay rating={review.rating} />
                    </div>

                    {review.user_email && (
                      <div className="flex items-center gap-2 mb-2 bg-blue-500/10 border border-blue-500/25 rounded-lg px-3 py-1.5 w-fit max-w-full">
                        <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="text-sm text-blue-300 font-mono truncate">{review.user_email}</span>
                        <button
                          onClick={() => copyEmail(review.user_email)}
                          className="text-blue-400 hover:text-blue-200 transition-colors shrink-0"
                          title="Copy email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {review.comment && (
                      <p className="text-sm text-foreground/80 mt-1 leading-relaxed">{review.comment}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => toggleApprovalMutation.mutate({ id: review.id, is_approved: !review.is_approved })}
                      className={review.is_approved ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}
                      title={review.is_approved ? 'Hide review' : 'Approve review'}
                    >
                      {review.is_approved ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this review?')) deleteMutation.mutate(review.id); }}
                      className="text-red-400 hover:text-red-300"
                      title="Delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
