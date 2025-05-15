import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import StatsBar from "@/components/StatsBar";
import StoryCard from "@/components/StoryCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, Shuffle } from "lucide-react";
import StoryViewModal from "@/components/StoryViewModal";

export default function ExpiringSoon() {
  const [, navigate] = useLocation();
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("day");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedStory, setSelectedStory] = useState<any>(null);

  const {
    data: story,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["/api/stories/expiring", selectedTimeframe, refreshTrigger],
    queryFn: async () => {
      const res = await fetch(`/api/stories/expiring/${selectedTimeframe}`);
      if (!res.ok) {
        throw new Error(
          `Failed to fetch a story expiring within ${selectedTimeframe}`
        );
      }
      return res.json();
    },
  });

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleTabChange = (value: string) => {
    setSelectedTimeframe(value);
  };

  const handleViewStory = (story: any) => {
    setSelectedStory(story);
  };

  const getTimeframeDescription = () => {
    switch (selectedTimeframe) {
      case "hour":
        return "Disappearing within the next hour";
      case "day":
        return "Disappearing within 24 hours";
      case "week":
        return "Disappearing within the next week";
      default:
        return "Disappearing soon";
    }
  };

  return (
    <>
      <StatsBar />

      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <h1 className="text-2xl font-bold">Expiring Soon</h1>

        <Button
          variant="outline"
          className="bg-amber-500 text-white hover:bg-amber-600 border-amber-500"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <Shuffle className="h-4 w-4 mr-2" />
          New Random
        </Button>
      </div>

      <Tabs
        defaultValue="day"
        value={selectedTimeframe}
        onValueChange={handleTabChange}
        className="mb-6"
      >
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="hour">Within Hour</TabsTrigger>
          <TabsTrigger value="day">Within Day</TabsTrigger>
          <TabsTrigger value="week">Within Week</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg mb-6">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-primary mr-2" />
          <p className="text-sm text-primary font-medium">
            {getTimeframeDescription()} - catch these stories before they're
            gone!
          </p>
        </div>
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
              <h2 className="text-xl font-bold mb-4">No Stories Found</h2>
              <p className="text-muted-all mb-6">
                {(error as Error).message ||
                  `No stories expiring within the ${selectedTimeframe} timeframe were found.`}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleRefresh}
                  className="flex items-center justify-center"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Try Another Timeframe
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        ) : !story ? (
          <div className="text-center py-12 w-full max-w-3xl">
            <div className="bg-white rounded-lg shadow-sm p-8 border border-light">
              <h2 className="text-xl font-bold mb-4">No Expiring Stories</h2>
              <p className="text-muted-all mb-6">
                There are no stories expiring within the selected timeframe.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() =>
                    document.getElementById("create-story-button")?.click()
                  }
                >
                  Create a Story
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Back to Home
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
              <p className="text-muted-all mb-6">
                Want to see another expiring story?
              </p>
              <Button
                onClick={handleRefresh}
                className="flex items-center justify-center"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Show Me Another
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
