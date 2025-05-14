import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, isPast } from "date-fns";
import { ArrowUp, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { formatTimeRemaining } from "@/lib/utils/time";

export default function StoryDetail() {
  const { id, accessToken } = useParams();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [hasVoted, setHasVoted] = useState(false);

  const queryKey = accessToken
    ? ["/api/stories/access", accessToken]
    : ["/api/stories", Number(id)];

  const apiPath = accessToken
    ? `/api/stories/access/${accessToken}`
    : `/api/stories/${id}`;

  const {
    data: story,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(apiPath);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Story not found");
        } else if (res.status === 410) {
          throw new Error("This story has expired");
        } else {
          throw new Error("Failed to load story");
        }
      }
      return res.json();
    },
  });

  useEffect(() => {
    // Check if user has already voted for this story
    if (story && isAuthenticated) {
      // In a real app, we would make an API call to check
      // For now we'll simulate this with local state
      const checkVote = async () => {
        try {
          // This is a placeholder for a real API call
          const voted =
            localStorage.getItem(`voted-${story.id}-${user?.id}`) === "true";
          setHasVoted(voted);
        } catch (error) {
          console.error("Failed to check vote status", error);
        }
      };

      checkVote();
    }
  }, [story, isAuthenticated, user]);

  const { mutate: voteForStory, isPending: isVoting } = useMutation({
    mutationFn: async (storyId: number) => {
      const res = await apiRequest("POST", `/api/stories/${storyId}/vote`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories", story?.id] });
      setHasVoted(true);

      // In a real app, this would be handled server-side
      localStorage.setItem(`voted-${story.id}-${user?.id}`, "true");

      toast({
        title: "Vote Recorded",
        description: "Thank you for voting!",
      });
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

    if (story && isPast(new Date(story.expiresAt))) {
      toast({
        title: "Story Expired",
        description: "You cannot vote for expired stories.",
        variant: "default",
      });
      return;
    }

    if (story) {
      voteForStory(story.id);
    }
  };

  const handleShare = () => {
    if (!story) return;

    // Create a shareable link with the story access token
    const shareUrl = `${window.location.origin}/s/${story.accessToken}`;

    // Use the Web Share API if available
    if (navigator.share) {
      navigator
        .share({
          title: story.title,
          text: "Check out this story on StoryVault",
          url: shareUrl,
        })
        .catch(() => {
          // Fallback to clipboard
          copyToClipboard(shareUrl);
        });
    } else {
      // Fallback to clipboard
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({
          title: "Link Copied!",
          description: "Story link copied to clipboard.",
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Could not copy the link. Please try again.",
          variant: "destructive",
        });
      });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-6">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-6 w-24" />
            </div>

            <div className="flex items-center mb-8">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="ml-3 h-4 w-32" />
            </div>

            <div className="space-y-4 mb-8">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Oops!</h1>
        <p className="text-muted mb-6">
          {(error as Error).message || "Something went wrong"}
        </p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Story Not Found</h1>
        <p className="text-muted mb-6">
          The story you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    );
  }

  const storyCreatedAt = new Date(story.createdAt);
  const storyExpiresAt = new Date(story.expiresAt);
  const isExpired = isPast(storyExpiresAt);

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-dark">{story.title}</h1>

            {!isExpired ? (
              <span
                className={`countdown-timer inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  storyExpiresAt.getTime() - Date.now() < 60 * 60 * 1000
                    ? "bg-error/10 text-error"
                    : storyExpiresAt.getTime() - Date.now() <
                      24 * 60 * 60 * 1000
                    ? "bg-warning/10 text-warning"
                    : "bg-secondary/10 text-secondary"
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
                Expires in {formatTimeRemaining(storyExpiresAt)}
              </span>
            ) : (
              <span className="countdown-timer inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/10 text-muted">
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
                Expired
              </span>
            )}
          </div>

          <div className="flex items-center mb-8">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={story.authorAvatar || ""}
                alt={story.authorName || "Author"}
              />
              <AvatarFallback>
                {story.authorName?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {story.authorName || "Anonymous"}
              </p>
              <p className="text-xs text-muted-foreground">
                Posted{" "}
                {formatDistanceToNow(storyCreatedAt, { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-dark-light mb-8">
            {story.content
              .split("\n")
              .map(
                (paragraph: string, index: number) =>
                  paragraph.trim() && <p key={index}>{paragraph}</p>
              )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-light">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className={`inline-flex items-center ${
                  hasVoted ? "text-primary" : "text-muted hover:text-primary"
                }`}
                onClick={handleVote}
                disabled={isVoting || hasVoted || isExpired}
              >
                <ArrowUp className="h-5 w-5 mr-1" />
                <span className="font-medium">{story.votes}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="inline-flex items-center text-muted hover:text-primary"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5 mr-1" />
                <span className="font-medium">Share</span>
              </Button>
            </div>

            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
