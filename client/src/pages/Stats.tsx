import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BarChart2,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  Shuffle,
} from "lucide-react";

export default function Stats() {
  const [, navigate] = useLocation();

  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/stats"],
    staleTime: 5 * 60 * 1000,
  });

  const statsCards = [
    {
      title: "Total Stories",
      value: stats?.total || 0,
      description: "Total number of stories ever created",
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      color: "bg-primary/10",
    },
    {
      title: "Available Stories",
      value: stats?.available || 0,
      description: "Stories currently accessible",
      icon: <BarChart2 className="h-8 w-8 text-primary" />,
      color: "bg-primary/10",
    },
    {
      title: "Expiring Today",
      value: stats?.expiringToday || 0,
      description: "Stories that will expire within 24 hours",
      icon: <Clock className="h-8 w-8 text-primary" />,
      color: "bg-primary/10",
    },
    {
      title: "Expiring This Hour",
      value: stats?.expiringHour || 0,
      description: "Stories disappearing very soon",
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      color: "bg-primary/10",
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <h1 className="text-2xl font-bold">Story Statistics</h1>
        <div className="w-[100px]"></div> {/* Empty div for centering */}
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Platform Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-all">
            Explore the current state of StoryVault. See how many stories are
            available, which ones are expiring soon, and the overall platform
            activity.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {isLoading ? (
          Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-12 w-12 rounded" />
                    <Skeleton className="h-12 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full mt-4" />
                </CardContent>
              </Card>
            ))
        ) : isError ? (
          <div className="col-span-1 md:col-span-2 text-center py-12">
            <p className="text-lg text-muted-all">
              Failed to load statistics. Please try again later.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </div>
        ) : (
          statsCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className={`p-4 rounded-lg ${card.color}`}>
                    {card.icon}
                  </div>
                  <div className="text-4xl font-bold">{card.value}</div>
                </div>
                <p className="text-muted-all mt-4 text-sm">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="bg-gradient-to-r from-primary/90 to-primary rounded-lg shadow-lg overflow-hidden p-6 text-center">
        <h2 className="text-xl font-bold text-white mb-4">Interesting Fact</h2>
        <p className="text-white/90 mb-6">
          {stats?.available && stats?.total
            ? `${Math.round(
                (stats.available / stats.total) * 100
              )}% of all stories ever created on StoryVault are still available for reading!`
            : "Stories on StoryVault have limited lifetimes, making each reading experience unique and time-sensitive!"}
        </p>
        <Button
          variant="outline"
          className="border-white text-white hover:bg-white/10"
          onClick={() => navigate("/random")}
        >
          <Shuffle className="h-4 w-4 mr-2" />
          Discover a Random Story
        </Button>
      </div>
    </>
  );
}
