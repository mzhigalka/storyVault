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
import { useLocation } from "wouter";

interface StoryCardProps {
  story: {
    id: number | string;
    _id?: string;
    title: string;
    content: string;
    createdAt: string | Date;
    expiresAt: string | Date;
    votes: number;
    accessToken: string;
    authorId?: string;
    author?: {
      username: string;
      avatar?: string;
    };
  };
  onVote?: (storyId: number | string) => void;
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

  const [location] = useLocation();
  const isHome = location === "/";

  const { mutate: voteForStory, isPending: isVoting } = useMutation({
    mutationFn: async (storyId: string | number) => {
      const storyIdStr =
        typeof storyId === "string" ? storyId : String(storyId);

      console.log("Voting for story ID:", storyIdStr);
      console.log("Story object:", story);

      if (!storyIdStr) {
        throw new Error("Не можна голосувати: ID історії відсутній");
      }

      const res = await apiRequest(
        "POST",
        `/api/stories/${storyIdStr}/vote`,
        {}
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Помилка сервера: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/stories", story._id || story.id],
      });
      if (onVote) {
        onVote(story._id || story.id);
      }
    },
    onError: (error: any) => {
      console.error("Vote error:", error);
      toast({
        title: "Помилка",
        description:
          error.message ||
          "Не вдалося проголосувати за цю історію. Спробуйте пізніше.",
        variant: "destructive",
      });
    },
  });

  const handleVote = () => {
    if (!isAuthenticated) {
      toast({
        title: "Потрібна авторизація",
        description: "Будь ласка, увійдіть щоб голосувати за історії.",
        variant: "default",
      });
      return;
    }

    if (isExpired) {
      toast({
        title: "Історія прострочена",
        description: "Не можна голосувати за прострочені історії.",
        variant: "default",
      });
      return;
    }

    voteForStory(story._id || story.id);
  };

  const getExpiryStatus = () => {
    if (isExpired) {
      return { text: "Закінчено", className: "bg-muted/10 text-muted-all" };
    }

    const hoursLeft = Math.floor(
      (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)
    );

    if (hoursLeft < 1) {
      return {
        text: `Закінчиться за ${formatTimeRemaining(expiresAt)}`,
        className: "bg-warning/10 text-warning",
      };
    } else if (hoursLeft < 24) {
      return {
        text: `Закінчиться за ${formatTimeRemaining(expiresAt)}`,
        className: "bg-warning/10 text-warning",
      };
    } else {
      return {
        text: `Закінчиться за ${formatTimeRemaining(expiresAt)}`,
        className: "bg-warning/10 text-warning",
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
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-all">
              Опубліковано {formatDistanceToNow(createdAt, { addSuffix: true })}
            </span>
            <span className="text-xs text-muted-all flex items-center mt-1">
              <span className="inline-block h-4 w-4 rounded-full bg-gray-200 mr-1.5 overflow-hidden">
                {story.author?.avatar ? (
                  <img
                    src={story.author.avatar}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-full w-full text-gray-500 p-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </span>
              {story.author?.username || "Анонім"}
            </span>
          </div>
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
            {isHome && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-muted-all p-0 ${
                    hasVoted ? "text-primary rotate-180" : "hover:text-primary "
                  } ${isVoting ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={handleVote}
                  disabled={isVoting}
                >
                  {hasVoted ? (
                    <ArrowUp className="h-5 w-5" />
                  ) : (
                    <ArrowUp className="h-5 w-5" />
                  )}
                </Button>
                <span className="font-medium text-dark">{story.votes}</span>
              </>
            )}
          </div>

          {onViewClick ? (
            <Button
              variant="link"
              className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 p-0"
              onClick={onViewClick}
            >
              Читати далі
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
              Читати далі
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
