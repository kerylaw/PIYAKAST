import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
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
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
