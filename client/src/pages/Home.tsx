import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import StatsBar from "@/components/StatsBar";
import StoryCard from "@/components/StoryCard";
import SortControls from "@/components/SortControls";
import Pagination from "@/components/Pagination";
import StoryViewModal from "@/components/StoryViewModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import CreateStoryModal from "@/components/CreateStoryModal";
import LoginModal from "@/components/LoginModal";

export default function Home() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStory, setSelectedStory] = useState<any>(null);

  const { isAuthenticated } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const itemsPerPage = 6;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/stories", sortBy, currentPage, itemsPerPage],
    queryFn: async () => {
      const sort = sortBy === "expiring" ? "latest" : sortBy;
      const res = await fetch(
        `/api/stories?sort=${sort}&page=${currentPage}&limit=${itemsPerPage}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch stories");
      }

      return res.json();
    },
  });

  const stories = data?.stories || [];
  const totalStories = data?.total || 0;
  const totalPages = Math.ceil(totalStories / itemsPerPage);

  // Sort stories by expiry date if sortBy is "expiring"
  const sortedStories =
    sortBy === "expiring"
      ? [...stories].sort(
          (a, b) =>
            new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
        )
      : stories;

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleRandomClick = () => {
    setLocation("/random");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewStory = (story: any) => {
    setSelectedStory(story);
  };

  const handleCreateStory = () => {
    if (isAuthenticated) {
      setIsCreateModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <>
      <StatsBar />

      {/* Hero Section */}
      <section className="mb-8 bg-gradient-to-r from-primary/90 to-primary rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-12 md:py-20 max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Share Your Stories with the World
          </h1>
          <p className="text-white/90 mb-8 text-lg">
            Create time-limited stories, share them with your friends, and let
            the world vote on your creativity.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-gray-100"
              onClick={handleCreateStory}
            >
              Create a Story
            </Button>
          </div>
        </div>
      </section>

      <SortControls
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onRandomClick={handleRandomClick}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-light"
              >
                <div className="p-5">
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
                </div>
              </div>
            ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted">
            Failed to load stories. Please try again later.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : sortedStories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted">No stories found.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() =>
              document.getElementById("create-story-button")?.click()
            }
          >
            Create the first story
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {sortedStories.map((story: any) => (
              <StoryCard
                key={story.id}
                story={story}
                onViewClick={() => handleViewStory(story)}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalStories}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <StoryViewModal
        story={selectedStory}
        isOpen={!!selectedStory}
        onClose={() => setSelectedStory(null)}
      />
    </>
  );
}
