import { Shuffle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface SortControlsProps {
  sortBy: string;
  onSortChange: (value: string) => void;
  onRandomClick: () => void;
}

export default function SortControls({
  sortBy,
  onSortChange,
  onRandomClick,
}: SortControlsProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h2 className="text-2xl font-bold text-dark">Browse Stories</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest First</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          className="bg-amber-500 text-white hover:bg-amber-600 border-amber-500"
          onClick={onRandomClick}
        >
          <Shuffle className="h-4 w-4 mr-2" />
          Random Story
        </Button>
      </div>
    </div>
  );
}
