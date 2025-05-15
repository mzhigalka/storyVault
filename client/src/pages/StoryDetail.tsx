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
          throw new Error("Історія не знайдена");
        } else if (res.status === 410) {
          throw new Error("Термін дії цієї історії закінчився");
        } else {
          throw new Error("Не вдалося завантажити історію");
        }
      }
      return res.json();
    },
  });

  useEffect(() => {
    if (story && isAuthenticated) {
      const checkVote = async () => {
        try {
          const voted =
            localStorage.getItem(`voted-${story.id}-${user?.id}`) === "true";
          setHasVoted(voted);
        } catch (error) {
          console.error("Не вдалося перевірити статус голосування", error);
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

      localStorage.setItem(`voted-${story.id}-${user?.id}`, "true");

      toast({
        title: "Голосування зафіксовано",
        description: "Дякую за голосування!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message ||
          "Не міг проголосувати за цю історію. Будь ласка, спробуйте ще раз.",
        variant: "destructive",
      });
    },
  });

  const handleVote = () => {
    if (!isAuthenticated) {
      toast({
        title: "Потрібна автентифікація",
        description: "Будь ласка, увійдіть, щоб проголосувати за історії.",
        variant: "default",
      });
      return;
    }

    if (hasVoted) {
      toast({
        title: "Вже проголосував",
        description: "Ви вже проголосували за цю історію.",
        variant: "default",
      });
      return;
    }

    if (story && isPast(new Date(story.expiresAt))) {
      toast({
        title: "Термін дії історії закінчився",
        description: "Ви не можете проголосувати за історії, що закінчилися.",
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

    const shareUrl = `${window.location.origin}/s/${story.accessToken}`;

    if (navigator.share) {
      navigator
        .share({
          title: story.title,
          text: "Перевірте цю історію далі наShitHappens",
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
        <h1 className="text-2xl font-bold mb-4">На жаль!</h1>
        <p className="text-muted-all mb-6">
          {(error as Error).message || "Something went wrong"}
        </p>
        <Button onClick={() => navigate("/")}>Назад до дому</Button>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Історія не знайдена</h1>
        <p className="text-muted-all mb-6">
          Історія, яку ви шукаєте, не існує або не була видалена.
        </p>
        <Button onClick={() => navigate("/")}>Назад до дому</Button>
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
                Закінчується в {formatTimeRemaining(storyExpiresAt)}
              </span>
            ) : (
              <span className="countdown-timer inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/10 text-muted-all">
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
                Закінчився
              </span>
            )}
          </div>

          <div className="flex items-center mb-8">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={story.authorAvatar || ""}
                alt={story.authorName || "Автор"}
              />
              <AvatarFallback>
                {story.authorName?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {story.authorName || "Анонімний"}
              </p>
              <p className="text-xs text-muted-foreground">
                Опубліковано{" "}
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
                  hasVoted
                    ? "text-primary"
                    : "text-muted-all hover:text-primary"
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
                className="inline-flex items-center text-muted-all hover:text-primary"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5 mr-1" />
                <span className="font-medium">Поділитися</span>
              </Button>
            </div>

            <Button variant="outline" onClick={() => navigate("/")}>
              Назад до дому
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
