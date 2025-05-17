import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format, isPast } from "date-fns";
import { Copy, Eye, Clock, Share2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StoryViewModal from "@/components/StoryViewModal";
import { formatTimeRemaining } from "@/lib/utils/time";

export default function AuthorDashboard() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [selectedStory, setSelectedStory] = useState<any>(null);

  const { data: stories, isLoading } = useQuery({
    queryKey: ["/api/stories/author"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h1 className="text-2xl font-bold mb-4">Інформаційна панель автора</h1>
        <p className="text-muted-all mb-6">
          Будь ласка, увійдіть, щоб переглянути свої історії.
        </p>
        <Button
          onClick={() => document.getElementById("login-button")?.click()}
        >
          Увійти
        </Button>
      </div>
    );
  }

  const copyShareLink = (accessToken: string) => {
    const link = `${window.location.origin}/s/${accessToken}`;
    navigator.clipboard.writeText(link).then(() => {
      toast({
        title: "Посилання скопійовано!",
        description: "Посилання на історію скопіюється на буфер обміну ",
      });
    });
  };

  const now = new Date();
  const activeStories =
    stories?.filter((story: any) => !isPast(new Date(story.expiresAt))) || [];
  const expiredStories =
    stories?.filter((story: any) => isPast(new Date(story.expiresAt))) || [];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Мої історії</h1>
        <p className="text-muted-all">
          Керуйте своїми історіями та перегляньте їх статистику.
        </p>
      </div>

      <Tabs defaultValue="active" className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="active">
            Активні історії ({activeStories.length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Історії, що закінчилися ({expiredStories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {isLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="mb-4">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-10 w-24" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : activeStories.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Clock className="mx-auto h-12 w-12 text-muted-all mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Немає активних історій
              </h3>
              <p className="text-muted-all mb-4">
                На даний момент у вас немає активних історій.
              </p>
              <Button
                onClick={() =>
                  document.getElementById("create-story-button")?.click()
                }
              >
                Створити історію
              </Button>
            </div>
          ) : (
            activeStories.map((story: any) => (
              <Card key={story.id} className="mb-4">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{story.title}</CardTitle>
                      <CardDescription>
                        Створений{" "}
                        {formatDistanceToNow(new Date(story.createdAt), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                    <span className="countdown-timer inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
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
                      Закінчується в{" "}
                      {formatTimeRemaining(new Date(story.expiresAt))}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-dark-light line-clamp-2 mb-4">
                    {story.content.length > 150
                      ? `${story.content.substring(0, 150)}...`
                      : story.content}
                  </p>
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        Голоси: {story.votes}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStory(story)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> Переглянути
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyShareLink(story.accessToken)}
                      >
                        <Copy className="h-4 w-4 mr-1" /> Копіювати посилання
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: story.title,
                              text: "Перевірте мою історію далі на ShitHappens",
                              url: `${window.location.origin}/s/${story.accessToken}`,
                            });
                          } else {
                            copyShareLink(story.accessToken);
                          }
                        }}
                      >
                        <Share2 className="h-4 w-4 mr-1" /> Поділитися
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="expired">
          {isLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="mb-4">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-10 w-24" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : expiredStories.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Clock className="mx-auto h-12 w-12 text-muted-all mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Немає історій, що закінчилися
              </h3>
              <p className="text-muted-all mb-4">
                У вас ще немає історій, що закінчилися.
              </p>
            </div>
          ) : (
            expiredStories.map((story: any) => (
              <Card key={story.id} className="mb-4 opacity-80">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{story.title}</CardTitle>
                      <CardDescription>
                        Створений{" "}
                        {formatDistanceToNow(new Date(story.createdAt), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
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
                      Закінчився{" "}
                      {formatDistanceToNow(new Date(story.expiresAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-dark-light line-clamp-2 mb-4">
                    {story.content.length > 150
                      ? `${story.content.substring(0, 150)}...`
                      : story.content}
                  </p>
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        Остаточні голоси: {story.votes}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStory(story)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> Переглянути
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyShareLink(story.accessToken)}
                      >
                        <Copy className="h-4 w-4 mr-1" /> Скопіюйте посилання
                        архіву
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <StoryViewModal
        story={selectedStory}
        isOpen={!!selectedStory}
        onClose={() => setSelectedStory(null)}
      />
    </>
  );
}
