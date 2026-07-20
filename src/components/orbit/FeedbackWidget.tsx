import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useWallet } from "@/hooks/use-wallet";

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { address } = useWallet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        user_address: address || "anonymous",
        content: feedback,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Feedback submitted. Thank you!");
      setFeedback("");
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--orbit-ink)] text-[var(--orbit-bg)] shadow-lg hover:scale-105 active:scale-95 transition-transform md:bottom-10 md:right-10"
        aria-label="Send Feedback"
      >
        <MessageSquare size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md border border-[var(--orbit-edge)] bg-black p-6 shadow-2xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-[var(--orbit-mute)] hover:text-[var(--orbit-ink)]"
            >
              <X size={20} />
            </button>
            <h2 className="mb-1 font-display text-xl font-semibold text-[var(--orbit-ink)]">
              Send Feedback
            </h2>
            <p className="mb-4 text-sm text-[var(--orbit-mute)]">
              Help us improve Orbit Finance. Found a bug or have a suggestion?
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full resize-none border border-[var(--orbit-edge)] bg-transparent p-3 text-[var(--orbit-ink)] placeholder:text-[var(--orbit-mute)] focus:border-[var(--orbit-accent)] focus:outline-none"
                rows={4}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="liquid-btn w-full justify-center disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
