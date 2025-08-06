import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Radio, 
  Eye, 
  Clock, 
  Users 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { formatDistanceToNow } from "date-fns";

export default function LiveNow() {
  const { data: liveStreams = [], isLoading } = useQuery({
    queryKey: ["/api/streams/live"],
  });

  const sortedStreams = Array.isArray(liveStreams) 
    ? [...liveStreams].sort((a: any, b: any) => (b.viewerCount || 0) - (a.viewerCount || 0))
    : [];

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center space-x-3 mb-8">
          <Radio className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold text-white">Live Now</h1>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-500 font-medium">
              {sortedStreams.length} streams live
            </span>
          </div>
        </div>

        {isLoading ? (
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
        ) : sortedStreams.length === 0 ? (
          <div className="text-center py-12">
            <Radio className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No live streams</h3>
            <p className="text-gray-500">No one is streaming right now. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedStreams.map((stream: any) => (
              <Link 
                key={stream.id} 
                href={`/stream/${stream.id}`}
                className="group"
                data-testid={`link-stream-${stream.id}`}
              >
                <div className="bg-dark-blue rounded-lg overflow-hidden border border-gray-700 hover:border-red-500 transition-colors">
                  <div className="relative aspect-video bg-gray-800">
                    {stream.thumbnailUrl ? (
                      <img 
                        src={stream.thumbnailUrl} 
                        alt={stream.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Radio className="h-12 w-12 text-gray-400" />
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
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                      <h3 className="font-semibold text-white group-hover:text-red-500 transition-colors line-clamp-2">
                        {stream.title}
                      </h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage 
                          src={stream.user?.profileImageUrl} 
                          alt={stream.user?.username || 'User'} 
                        />
                        <AvatarFallback>
                          {(stream.user?.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {stream.user?.username}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-gray-400">
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
                    
                    {stream.category && (
                      <Badge variant="outline" className="text-xs">
                        {stream.category}
                      </Badge>
                    )}
                    
                    {stream.description && (
                      <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                        {stream.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Categories filter - could be added later */}
        {sortedStreams.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-white mb-4">Browse by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['K-Beauty', 'K-Pop', 'K-Drama', 'K-Movie', 'Tech', 'Sports', 'Cooking', 'Travel'].map((category) => (
                <Link 
                  key={category}
                  href={`/category/${category.toLowerCase()}`}
                  className="group"
                  data-testid={`link-category-${category.toLowerCase()}`}
                >
                  <div className="bg-dark-blue border border-gray-700 rounded-lg p-4 text-center hover:border-red-500 transition-colors">
                    <span className="text-sm font-medium text-white group-hover:text-red-500 transition-colors">
                      {category}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}