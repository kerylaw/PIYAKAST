import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useEffect, useRef } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import VideoWatch from "@/pages/VideoWatch";
import LiveStream from "@/pages/LiveStream";
import Profile from "@/pages/Profile";
import Trending from "@/pages/Trending";
import LiveNow from "@/pages/LiveNow";
import Videos from "@/pages/Videos";
import Category from "@/pages/Category";
import AuthPage from "@/pages/auth-page";
import Studio from "@/pages/Studio";

// Global stream heartbeat manager
function StreamHeartbeatManager() {
  const { user, isAuthenticated } = useAuth();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: userStreams = [] } = useQuery({
    queryKey: ["/api/streams/user", user?.id],
    enabled: !!user?.id && isAuthenticated,
    refetchInterval: 10000, // Check every 10 seconds
  });

  const activeStream = Array.isArray(userStreams) 
    ? userStreams.find((stream: any) => stream.isLive && stream.isPublic)
    : null;

  useEffect(() => {
    if (activeStream?.id) {
      console.log("Starting global heartbeat for stream:", activeStream.id);
      
      // Clear any existing heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      // Send heartbeat immediately
      const sendHeartbeat = () => {
        console.log("Sending global stream heartbeat for:", activeStream.id);
        const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          ws.send(JSON.stringify({
            type: 'stream_heartbeat',
            streamId: activeStream.id
          }));
          ws.close();
        };
        
        ws.onerror = (error) => {
          console.error("Heartbeat WebSocket error:", error);
        };
      };

      sendHeartbeat(); // Send immediately
      
      // Set up interval for regular heartbeats
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, 15000); // Every 15 seconds
      
      return () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      };
    } else {
      // No active stream, clear heartbeat
      if (heartbeatIntervalRef.current) {
        console.log("Clearing global heartbeat - no active stream");
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    }
  }, [activeStream?.id]);

  return null; // This component doesn't render anything
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      {/* Global stream heartbeat manager - works regardless of current page */}
      {isAuthenticated && <StreamHeartbeatManager />}
      
      <Switch>
        {isLoading ? (
          <Route path="*">
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </Route>
        ) : !isAuthenticated ? (
          <>
            <Route path="/" component={Landing} />
            <Route path="/auth" component={AuthPage} />
            <Route component={Landing} />
          </>
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/trending" component={Trending} />
            <Route path="/live" component={LiveNow} />
            <Route path="/videos" component={Videos} />
            <Route path="/category/:category" component={Category} />
            <Route path="/watch/:id" component={VideoWatch} />
            <Route path="/stream/:id" component={LiveStream} />
            <Route path="/profile/:username" component={Profile} />
            <Route path="/studio" component={Studio} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <div>
              <Toaster />
              <Router />
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
