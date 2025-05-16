import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowUp, Share2, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatTimeRemaining } from "@/lib/utils/time";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StoryViewModalProps {
  story: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function StoryViewModal({
  story,
  isOpen,
  onClose,
}: StoryViewModalProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);

  useEffect(() => {
    if (story) {
      setVoteCount(story.votes);
    }
  }, [story]);

  const { mutate: voteForStory, isPending: isVoting } = useMutation({
    mutationFn: async (storyId: number) => {
      const res = await apiRequest("POST", `/api/stories/${storyId}/vote`, {});
      return res.json();
    },
    onSuccess: (data) => {
      setHasVoted(true);
      setVoteCount(data.votes);
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories", story?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message || "Could not vote for this story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote for stories.",
        variant: "default",
      });
      return;
    }

    if (hasVoted) {
      toast({
        title: "Already Voted",
        description: "You have already voted for this story.",
        variant: "default",
      });
      return;
    }

    if (!story) return;

    voteForStory(story.id);
  };

  const handleShare = () => {
    if (!story) return;

    const shareUrl = `${window.location.origin}/s/${story.accessToken}`;

    if (navigator.share) {
      navigator
        .share({
          title: story.title,
          text: "Check out this story on ShitHappens",
          url: shareUrl,
        })
        .catch(() => {
          copyToClipboard(shareUrl);
        });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({
          title: "Посилання скопійовано!",
          description: "Посилання на історію скопіюється на буфер обміну.",
        });
      })
      .catch(() => {
        toast({
          title: "Помилка",
          description:
            "Не міг скопіювати посилання.Будь ласка, спробуйте ще раз.",
          variant: "destructive",
        });
      });
  };

  if (!story) return null;

  const storyCreatedAt = new Date(story.createdAt);
  const storyExpiresAt = new Date(story.expiresAt);
  const isExpired = storyExpiresAt < new Date();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="flex justify-between items-start">
          <DialogTitle className="text-xl font-bold text-dark">
            {story.title}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={story.author?.avatar}
                alt={story.authorName || "Автор"}
              />
              <AvatarFallback>
                {story.authorName?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <span className="ml-2 text-sm font-medium text-dark-light">
              {story.author?.username || "Анонім"}
            </span>
          </div>
          {!isExpired && (
            <span
              className={`countdown-timer inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                storyExpiresAt.getTime() - Date.now() < 60 * 60 * 1000
                  ? "bg-warning/10 text-warning"
                  : storyExpiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000
                  ? "bg-warning/10 text-warning"
                  : "bg-warning/10 text-warning"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Закінчується в {formatTimeRemaining(storyExpiresAt)}
            </span>
          )}
        </div>

        <div className="mt-6 prose prose-sm max-w-none text-dark-light">
          {story.content
            .split("\n")
            .map(
              (paragraph: string, index: number) =>
                paragraph.trim() && <p key={index}>{paragraph}</p>
            )}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className={`inline-flex items-center ${
                hasVoted ? "text-primary" : "text-muted-all hover:text-primary"
              }`}
              onClick={handleVote}
              disabled={isVoting || hasVoted || isExpired}
            >
              <ArrowUp className="h-5 w-5 mr-1" />
              <span className="font-medium">{voteCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="inline-flex items-center text-muted-all hover:text-primary"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5 mr-1" />
              <span className="font-medium">Поділитися</span>
            </Button>
          </div>

          <span className="text-xs text-muted-all">
            Опубліковано{" "}
            {formatDistanceToNow(storyCreatedAt, { addSuffix: true })}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
