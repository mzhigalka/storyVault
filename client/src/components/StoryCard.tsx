import { Link } from "wouter";
import { formatDistanceToNow, isPast } from "date-fns";
import { ArrowUpCircle, ArrowUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatTimeRemaining } from "@/lib/utils/time";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StoryCardProps {
  story: {
    id: number;
    title: string;
    content: string;
    createdAt: string | Date;
    expiresAt: string | Date;
    votes: number;
    accessToken: string;
  };
  onVote?: (storyId: number) => void;
  hasVoted?: boolean;
  onViewClick?: () => void;
}

export default function StoryCard({
  story,
  onVote,
  hasVoted = false,
  onViewClick,
}: StoryCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const createdAt = new Date(story.createdAt);
  const expiresAt = new Date(story.expiresAt);
  const isExpired = isPast(expiresAt);

  const { mutate: voteForStory, isPending: isVoting } = useMutation({
    mutationFn: async (storyId: number) => {
      const res = await apiRequest("POST", `/api/stories/${storyId}/vote`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories", story.id] });
      if (onVote) {
        onVote(story.id);
      }
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

    if (isExpired) {
      toast({
        title: "Story Expired",
        description: "You cannot vote for expired stories.",
        variant: "default",
      });
      return;
    }

    voteForStory(story.id);
  };

  // Calculate time status for display
  const getExpiryStatus = () => {
    if (isExpired) {
      return { text: "Expired", className: "bg-muted/10 text-muted-all" };
    }

    const hoursLeft = Math.floor(
      (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
    );

    if (hoursLeft < 1) {
      return {
        text: `Expires in ${formatTimeRemaining(expiresAt)}`,
        className: "bg-error/10 text-muted-all",
      };
    } else if (hoursLeft < 24) {
      return {
        text: `Expires in ${formatTimeRemaining(expiresAt)}`,
        className: "bg-warning/10 text-muted-all",
      };
    } else {
      return {
        text: `Expires in ${formatTimeRemaining(expiresAt)}`,
        className: "bg-secondary/10 text-muted-all",
      };
    }
  };

  const expiryStatus = getExpiryStatus();

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength).trim() + "...";
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm overflow-hidden border border-light hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-medium text-muted-all">
            Posted {formatDistanceToNow(createdAt, { addSuffix: true })}
          </span>
          <span
            className={`countdown-timer inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expiryStatus.className}`}
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
            {expiryStatus.text}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-dark mb-2">{story.title}</h3>

        <p className="text-dark-light line-clamp-3 mb-4">
          {truncateContent(story.content)}
        </p>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className={`text-muted p-0 ${
                hasVoted ? "text-primary" : "hover:text-primary"
              } ${isVoting ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={handleVote}
              disabled={isVoting || hasVoted}
            >
              {hasVoted ? (
                <ArrowUpCircle className="h-5 w-5" />
              ) : (
                <ArrowUp className="h-5 w-5" />
              )}
            </Button>
            <span className="font-medium text-dark">{story.votes}</span>
          </div>

          {onViewClick ? (
            <Button
              variant="link"
              className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 p-0"
              onClick={onViewClick}
            >
              Read more
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Button>
          ) : (
            <Link
              href={`/story/${story.id}`}
              className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80"
            >
              Read more
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
