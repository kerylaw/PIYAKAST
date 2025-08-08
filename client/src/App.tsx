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
import AdminPage from "@/pages/AdminPage";
import Advertiser from "@/pages/Advertiser";
import Settings from "@/pages/Settings";
import ChannelMembership from "@/pages/ChannelMembership";

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

      // Send heartbeat immediately (HTTP fallback if WebSocket fails)
      const sendHeartbeat = async () => {
        console.log("Sending global stream heartbeat for:", activeStream.id);
        
        try {
          // Try WebSocket first
          const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
          const ws = new WebSocket(wsUrl);
          
          const wsPromise = new Promise((resolve, reject) => {
            ws.onopen = () => {
              console.log("✅ Heartbeat WebSocket connected, sending heartbeat");
              ws.send(JSON.stringify({
                type: 'stream_heartbeat',
                streamId: activeStream.id
              }));
              
              setTimeout(() => {
                ws.close();
                resolve(true);
              }, 100);
            };
            
            ws.onerror = (error) => {
              console.error("❌ Heartbeat WebSocket error:", error);
              reject(error);
            };
          });
          
          // Set a timeout for WebSocket connection
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('WebSocket timeout')), 2000);
          });
          
          await Promise.race([wsPromise, timeoutPromise]);
          
        } catch (error) {
          console.warn("WebSocket heartbeat failed, using HTTP fallback:", error);
          
          // HTTP fallback
          try {
            const response = await fetch(`/api/streams/${activeStream.id}/heartbeat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            
            if (response.ok) {
              console.log("✅ HTTP heartbeat sent successfully");
            } else {
              console.error("❌ HTTP heartbeat failed:", response.status);
            }
          } catch (httpError) {
            console.error("❌ HTTP heartbeat error:", httpError);
          }
        }
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
            <Route path="/admin" component={AdminPage} />
            <Route path="/advertiser" component={Advertiser} />
            <Route path="/ads" component={Advertiser} />
            <Route path="/settings" component={Settings} />
            <Route path="/channel/:channelId/membership" component={ChannelMembership} />
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
