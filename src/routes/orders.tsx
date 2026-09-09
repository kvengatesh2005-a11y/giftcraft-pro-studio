import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { Package, CheckCircle2, XCircle, Clock, CreditCard, Star, MessageSquarePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMyOrders } from "@/lib/data";
import { useApp } from "@/lib/store";
import { getDb } from "@/lib/firebase";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — br_Treasure_Trove" },
      { name: "description", content: "Track the status of your br_Treasure_Trove gift orders." },
      { property: "og:title", content: "My Orders — br_Treasure_Trove" },
      { property: "og:description", content: "Track the status of your gift orders." },
    ],
  }),
  component: Orders,
});

const statusColor: Record<string, string> = {
  pending: "bg-gold/20 text-gold-foreground",
  confirmed: "bg-primary/10 text-primary",
  shipped: "bg-primary/10 text-primary",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-destructive/10 text-destructive",
};

function getPaymentBadge(status?: string) {
  const s = (status || "PENDING_VERIFICATION").toUpperCase();
  if (s === "VERIFIED" || s === "PAID" || s === "SUCCESS") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        Payment Verified
      </span>
    );
  }
  if (s === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
        <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
        Payment Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
      Payment Pending Verification
    </span>
  );
}

function Orders() {
  const { user } = useApp();
  const { data: orders = [], isLoading } = useMyOrders(user?.uid, user?.email);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedItemForReview, setSelectedItemForReview] = useState<{
    orderId: string;
    productId: string;
    productName: string;
  } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submittedReviews, setSubmittedReviews] = useState<Record<string, boolean>>({});

  // Fetch user's submitted reviews to mark items as reviewed
  useEffect(() => {
    if (!user?.uid) return;
    async function fetchUserReviews() {
      try {
        const db = getDb();
        const snap = await getDocs(query(collection(db, "reviews"), where("userId", "==", user.uid)));
        const reviewedMap: Record<string, boolean> = {};
        snap.docs.forEach((doc) => {
          const data = doc.data();
          if (data.orderId && data.productId) {
            reviewedMap[`${data.orderId}_${data.productId}`] = true;
          } else if (data.productId) {
            reviewedMap[`${data.productId}`] = true;
          }
        });
        setSubmittedReviews(reviewedMap);
      } catch (err) {
        console.error("Error fetching user reviews:", err);
      }
    }
    fetchUserReviews();
  }, [user?.uid]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForReview || !comment.trim()) {
      toast.error("Please enter your feedback comment.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const db = getDb();
      await addDoc(collection(db, "reviews"), {
        productId: selectedItemForReview.productId,
        orderId: selectedItemForReview.orderId,
        userId: user?.uid ?? null,
        userName: user?.name || user?.email?.split("@")[0] || "Customer",
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      });

      toast.success("Thank you! Your feedback & review has been submitted.");
      setSubmittedReviews((prev) => ({
        ...prev,
        [`${selectedItemForReview.orderId}_${selectedItemForReview.productId}`]: true,
      }));
      setReviewModalOpen(false);
      setComment("");
      setRating(5);
      setSelectedItemForReview(null);
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-primary">Sign in to view your orders</h1>
        <Button asChild className="mt-6">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl text-primary">My orders</h1>
      {isLoading ? (
        <div className="mt-8 h-40 animate-pulse rounded-xl bg-muted" />
      ) : orders.length === 0 ? (
        <div className="py-20 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No orders yet.</p>
          <Button asChild className="mt-6">
            <Link to="/shop">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((o) => {
            const pStatus = (o.paymentStatus || "PENDING_VERIFICATION").toUpperCase();
            const isVerified = pStatus === "VERIFIED" || pStatus === "PAID" || pStatus === "SUCCESS";
            const isFailed = pStatus === "FAILED";
            const isDelivered = o.status.toLowerCase() === "delivered";

            return (
              <div key={o.id} className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-4">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <p className="font-semibold text-base">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      Placed on {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Status:</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        statusColor[o.status] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                </div>

                {/* Payment Information Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 p-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">{o.paymentMethod}</span>
                      {o.transactionId && (
                        <span className="ml-2 font-mono text-[0.75rem] text-muted-foreground">
                          (UTR: {o.transactionId})
                        </span>
                      )}
                    </div>
                  </div>
                  <div>{getPaymentBadge(o.paymentStatus)}</div>
                </div>

                {/* Payment Status Notice Banner */}
                {isFailed && (
                  <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-700 dark:text-rose-300">
                    ⚠️ <strong>Payment Failed / Rejected by Admin:</strong> If money was deducted from your bank account, please contact store support with your UTR ID ({o.transactionId || "N/A"}).
                  </div>
                )}
                {!isFailed && !isVerified && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-800 dark:text-amber-300">
                    ⏳ <strong>Payment Under Verification:</strong> Our team is verifying your payment. Your order status will update shortly.
                  </div>
                )}

                {/* Delivered Order Feedback / Review Banner */}
                {isDelivered && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                        <span>Order Delivered! How was your experience?</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {o.items?.map((it) => {
                        const reviewKey = `${o.id}_${it.id}`;
                        const altKey = `${it.id}`;
                        const isReviewed = submittedReviews[reviewKey] || submittedReviews[altKey];

                        return (
                          <Button
                            key={it.id}
                            size="sm"
                            variant={isReviewed ? "outline" : "default"}
                            className={
                              isReviewed
                                ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs h-8"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 shadow-sm"
                            }
                            disabled={isReviewed}
                            onClick={() => {
                              setSelectedItemForReview({
                                orderId: o.id,
                                productId: it.id,
                                productName: it.name,
                              });
                              setReviewModalOpen(true);
                            }}
                          >
                            {isReviewed ? (
                              <>
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                                Reviewed ({it.name.length > 15 ? it.name.slice(0, 15) + "..." : it.name})
                              </>
                            ) : (
                              <>
                                <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />
                                Rate & Review {it.name.length > 15 ? it.name.slice(0, 15) + "..." : it.name}
                              </>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Ordered Items List */}
                <ul className="space-y-2 text-sm pt-1">
                  {o.items?.map((it) => (
                    <li key={it.id} className="flex justify-between items-center text-muted-foreground">
                      <span>
                        {it.name} × {it.quantity}
                      </span>
                      <span className="font-medium text-foreground">
                        {o.currency}
                        {(it.price * it.quantity).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Total */}
                <div className="flex justify-between border-t border-border pt-3 font-semibold text-base">
                  <span>Total Paid / Payable</span>
                  <span className="text-primary">
                    {o.currency}
                    {Number(o.total).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review / Feedback Modal */}
      {reviewModalOpen && selectedItemForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lift space-y-4 relative">
            <button
              onClick={() => {
                setReviewModalOpen(false);
                setSelectedItemForReview(null);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1 pr-6">
              <h3 className="font-display text-xl text-primary flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                Write Product Review
              </h3>
              <p className="text-xs text-muted-foreground">
                Reviewing: <strong className="text-foreground">{selectedItemForReview.productName}</strong>
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
              {/* Rating Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= rating ? "fill-amber-400 text-amber-400" : "text-muted border-muted shrink-0"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-semibold text-muted-foreground">{rating} / 5 Stars</span>
                </div>
              </div>

              {/* Feedback Textarea */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Your Feedback & Review</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this item, quality, delivery, etc..."
                  rows={4}
                  required
                  className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReviewModalOpen(false);
                    setSelectedItemForReview(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground" disabled={isSubmittingReview}>
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
