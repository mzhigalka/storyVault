import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import StatsBar from "@/components/StatsBar";
import StoryCard from "@/components/StoryCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shuffle, ArrowLeft, RotateCw } from "lucide-react";
import StoryViewModal from "@/components/StoryViewModal";

export default function Random() {
  const [, navigate] = useLocation();
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const {
    data: story,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["/api/stories/random", refreshTrigger],
    queryFn: async () => {
      const res = await fetch("/api/stories/random");
      if (!res.ok) {
        throw new Error("Не вдалося отримати випадкову історію");
      }
      return res.json();
    },
  });

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleViewStory = (story: any) => {
    setSelectedStory(story);
  };

  return (
    <>
      <StatsBar />

      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад до дому
        </Button>

        <h1 className="text-2xl font-bold">Випадкова історія</h1>

        <Button
          variant="outline"
          className="bg-amber-500 text-white hover:bg-amber-600 border-amber-500"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <Shuffle className="h-4 w-4 mr-2" />
          Нова випадкова історія
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center mb-12">
        {isLoading ? (
          <Card className="w-full max-w-3xl bg-white rounded-lg shadow-sm overflow-hidden border border-light">
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ) : isError ? (
          <div className="text-center py-12 w-full max-w-3xl">
            <div className="bg-white rounded-lg shadow-sm p-8 border border-light">
              <h2 className="text-xl font-bold mb-4">
                Не вдалося знайти історію
              </h2>
              <p className="text-muted mb-6">
                {(error as Error).message ||
                  "No stories are available right now."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleRefresh}
                  className="flex items-center justify-center"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Спробуйте ще раз
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад до дому
                </Button>
              </div>
            </div>
          </div>
        ) : !story ? (
          <div className="text-center py-12 w-full max-w-3xl">
            <div className="bg-white rounded-lg shadow-sm p-8 border border-light">
              <h2 className="text-xl font-bold mb-4">Немає історій</h2>
              <p className="text-muted mb-6">
                На даний момент немає історій, які б демонструвались.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() =>
                    document.getElementById("create-story-button")?.click()
                  }
                >
                  Створити історію
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Назад до дому
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl">
            <StoryCard
              story={story}
              onViewClick={() => handleViewStory(story)}
            />

            <div className="mt-8 text-center">
              <p className="text-muted mb-6">Хочете побачити іншу історію?</p>
              <Button
                onClick={handleRefresh}
                className="flex items-center justify-center"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Покажи мені іншу
              </Button>
            </div>
          </div>
        )}
      </div>

      <StoryViewModal
        story={selectedStory}
        isOpen={!!selectedStory}
        onClose={() => setSelectedStory(null)}
      />
    </>
  );
}
