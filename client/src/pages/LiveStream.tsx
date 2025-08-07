import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import LiveStreamViewer from "@/components/LiveStreamViewer";
import { Skeleton } from "@/components/ui/skeleton";

export default function LiveStream() {
  const { id } = useParams();

  // Fetch stream details
  const { data: stream, isLoading } = useQuery<any>({
    queryKey: ["/api/streams", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Skeleton className="w-full aspect-video rounded-lg" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!stream) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Stream Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">
            This stream may have ended or the URL is incorrect.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <LiveStreamViewer
          streamId={stream.id}
          title={stream.title}
          description={stream.description}
          category={stream.category}
          streamerName={stream.user?.username || "Unknown"}
          streamerAvatar={stream.user?.profileImageUrl}
          viewerCount={stream.viewerCount || 0}
          isLive={stream.isLive}
          startedAt={stream.startedAt}
          peertubeEmbedUrl={stream.peertubeEmbedUrl}
          rtmpUrl={stream.rtmpUrl}
          streamKey={stream.streamKey}
        />
      </div>
    </Layout>
  );
}