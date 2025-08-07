import { useQuery } from "@tanstack/react-query";
import { 
  Play, 
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/Layout";
import VideoCard from "@/components/VideoCard";
import { useState } from "react";

export default function Videos() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["/api/videos"],
  });

  // Filter and sort videos
  const filteredVideos = Array.isArray(videos) 
    ? videos.filter((video: any) => {
        const matchesSearch = searchQuery === "" || 
          video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = categoryFilter === "all" || 
          video.category?.toLowerCase() === categoryFilter.toLowerCase();
        
        return matchesSearch && matchesCategory;
      }).sort((a: any, b: any) => {
        switch (sortBy) {
          case "views":
            return (b.viewCount || 0) - (a.viewCount || 0);
          case "likes":
            return (b.likes || 0) - (a.likes || 0);
          case "oldest":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "recent":
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      })
    : [];

  const categories = Array.isArray(videos) 
    ? Array.from(new Set(videos.map((video: any) => video.category).filter(Boolean)))
    : [];

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center space-x-3 mb-8">
          <Play className="h-8 w-8 text-primary-purple" />
          <h1 className="text-3xl font-bold text-white">Videos</h1>
          <span className="text-gray-400">
            {filteredVideos.length} videos
          </span>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-dark-blue border-gray-700 text-white"
                data-testid="input-search-videos"
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-dark-blue border-gray-700 text-white" data-testid="select-sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="likes">Most Liked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 bg-dark-blue border-gray-700 text-white" data-testid="select-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Video Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-dark-blue rounded-lg p-4 animate-pulse">
                <div className="aspect-video bg-gray-700 rounded mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {searchQuery ? "No videos found" : "No videos yet"}
            </h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No videos match "${searchQuery}". Try a different search term.`
                : "Upload the first video to get started!"
              }
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                }}
                className="mt-4"
                data-testid="button-clear-search"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video: any) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnailUrl={video.thumbnailUrl}
                videoUrl={video.videoUrl}
                duration={video.duration}
                viewCount={video.viewCount || 0}
                createdAt={video.createdAt}
                user={{
                  username: video.user?.username || 'Unknown',
                  profileImageUrl: video.user?.profileImageUrl
                }}
              />
            ))}
          </div>
        )}

        {/* Load more button could be added here for pagination */}
        {filteredVideos.length > 0 && (
          <div className="text-center mt-12">
            <p className="text-gray-400 text-sm">
              Showing {filteredVideos.length} videos
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}