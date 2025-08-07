import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { 
  Sparkles, 
  Music, 
  Heart, 
  Film,
  ChefHat,
  Play, 
  Eye, 
  Clock, 
  Radio,
  Users,
  Hash
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import { formatDistanceToNow } from "date-fns";

const categoryConfig = {
  "k-beauty": {
    name: "K-Beauty",
    icon: Sparkles,
    color: "text-pink-400",
    description: "Korean beauty content, makeup tutorials, and skincare routines"
  },
  "k-pop": {
    name: "K-Pop",
    icon: Music,
    color: "text-pink-500",
    description: "K-Pop music, dance covers, and entertainment content"
  },
  "k-drama": {
    name: "K-Drama",
    icon: Heart,
    color: "text-red-500",
    description: "Korean drama reviews, discussions, and behind-the-scenes content"
  },
  "k-movie": {
    name: "K-Movie",
    icon: Film,
    color: "text-purple-500",
    description: "Korean film reviews, trailers, and movie discussions"
  },
  "k-food": {
    name: "K-Food",
    icon: ChefHat,
    color: "text-orange-500",
    description: "Korean food recipes, cooking tutorials, and restaurant reviews"
  }
};

export default function Category() {
  const { category } = useParams<{ category: string }>();
  const config = categoryConfig[category as keyof typeof categoryConfig];

  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["/api/videos"],
  });

  const { data: liveStreams = [], isLoading: streamsLoading } = useQuery({
    queryKey: ["/api/streams/live"],
  });

  // Filter content by category
  const categoryVideos = Array.isArray(videos) 
    ? videos.filter((video: any) => 
        video.category?.toLowerCase() === config?.name.toLowerCase()
      ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  const categoryStreams = Array.isArray(liveStreams) 
    ? liveStreams.filter((stream: any) => 
        stream.category?.toLowerCase() === config?.name.toLowerCase()
      ).sort((a: any, b: any) => (b.viewerCount || 0) - (a.viewerCount || 0))
    : [];

  if (!config) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Category Not Found</h1>
          <p className="text-muted-foreground">The category "{category}" doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  const IconComponent = config.icon;

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <div className={`p-3 rounded-full bg-gray-800 dark:bg-gray-700 ${config.color}`}>
            <IconComponent className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{config.name}</h1>
            <p className="text-muted-foreground mt-1">{config.description}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg p-4 border border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-primary-purple" />
              <span className="text-sm font-medium text-foreground">Videos</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{categoryVideos.length}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border hover:border-red-500/50 transition-colors">
            <div className="flex items-center space-x-2">
              <Radio className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-foreground">Live</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{categoryStreams.length}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border hover:border-blue-500/50 transition-colors">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-foreground">Total Views</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">
              {categoryVideos.reduce((sum: number, video: any) => sum + (video.viewCount || 0), 0)}
            </p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border hover:border-green-500/50 transition-colors">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-foreground">Viewers</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">
              {categoryStreams.reduce((sum: number, stream: any) => sum + (stream.viewerCount || 0), 0)}
            </p>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card">
            <TabsTrigger value="videos" data-testid="tab-videos" className="font-medium">
              Videos ({categoryVideos.length})
            </TabsTrigger>
            <TabsTrigger value="live" data-testid="tab-live" className="font-medium">
              Live ({categoryStreams.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="mt-6">
            {videosLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-dark-blue rounded-lg p-4 animate-pulse">
                    <div className="aspect-video bg-gray-700 rounded mb-3" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : categoryVideos.length === 0 ? (
              <div className="text-center py-12">
                <IconComponent className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No {config.name.toLowerCase()} videos yet
                </h3>
                <p className="text-muted-foreground">
                  Be the first to upload {config.name.toLowerCase()} content!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryVideos.map((video: any) => (
                  <Link 
                    key={video.id} 
                    href={`/watch/${video.id}`}
                    className="group"
                    data-testid={`link-video-${video.id}`}
                  >
                    <div className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-colors">
                      <div className="relative aspect-video bg-muted">
                        {video.thumbnailUrl ? (
                          <img 
                            src={video.thumbnailUrl} 
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <Badge className={`text-xs ${config.color} bg-background/90 backdrop-blur-sm`}>
                            <Hash className="h-3 w-3 mr-1" />
                            {config.name}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage 
                              src={video.user?.profileImageUrl} 
                              alt={video.user?.username || 'User'} 
                            />
                            <AvatarFallback className="text-xs">
                              {(video.user?.username || 'U')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground truncate">
                            {video.user?.username}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{video.viewCount || 0} views</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="live" className="mt-6">
            {streamsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-dark-blue rounded-lg p-4 animate-pulse">
                    <div className="aspect-video bg-gray-700 rounded mb-3" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : categoryStreams.length === 0 ? (
              <div className="text-center py-12">
                <Radio className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No live {config.name.toLowerCase()} streams
                </h3>
                <p className="text-muted-foreground">
                  No one is streaming {config.name.toLowerCase()} content right now.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryStreams.map((stream: any) => (
                  <Link 
                    key={stream.id} 
                    href={`/stream/${stream.id}`}
                    className="group"
                    data-testid={`link-stream-${stream.id}`}
                  >
                    <div className="bg-card rounded-lg overflow-hidden border border-border hover:border-red-500 transition-colors">
                      <div className="relative aspect-video bg-muted">
                        {stream.thumbnailUrl ? (
                          <img 
                            src={stream.thumbnailUrl} 
                            alt={stream.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Radio className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full mr-1" />
                            LIVE
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{stream.viewerCount || 0}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground group-hover:text-red-500 transition-colors mb-2 line-clamp-2">
                          {stream.title}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage 
                              src={stream.user?.profileImageUrl} 
                              alt={stream.user?.username || 'User'} 
                            />
                            <AvatarFallback className="text-xs">
                              {(stream.user?.username || 'U')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground truncate">
                            {stream.user?.username}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{stream.viewerCount || 0} viewers</span>
                          </div>
                          {stream.startedAt && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(new Date(stream.startedAt), { addSuffix: true })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}