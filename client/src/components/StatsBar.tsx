import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsBar() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <section className="mb-8 bg-white rounded-lg shadow-sm p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-3">
          <p className="text-muted-all text-sm">Всього</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mx-auto mt-1" />
          ) : (
            <p className="text-2xl font-bold text-dark">{stats?.total || 0}</p>
          )}
        </div>

        <div className="text-center p-3">
          <p className="text-muted-all text-sm">Доступні історії</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mx-auto mt-1" />
          ) : (
            <p className="text-2xl font-bold text-dark">
              {stats?.available || 0}
            </p>
          )}
        </div>

        <div className="text-center p-3">
          <p className="text-muted-all text-sm">Закінчується сьогодні</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mx-auto mt-1" />
          ) : (
            <p className="text-2xl font-bold text-dark">
              {stats?.expiringToday || 0}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
