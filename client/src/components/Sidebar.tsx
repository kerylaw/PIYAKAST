import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  TrendingUp, 
  Radio, 
  Play, 
  Sparkles, 
  Music, 
  Heart, 
  Film,
  ChefHat,
  X,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ className, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Fetch following list
  const { data: following = [] } = useQuery({
    queryKey: ["/api/users", user?.id, "following"],
    enabled: !!user?.id && isAuthenticated,
  });

  const navigationItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/trending", icon: TrendingUp, label: "Trending" },
    { href: "/live", icon: Radio, label: "Live Now" },
    { href: "/videos", icon: Play, label: "Videos" },
  ];

  const categoryItems = [
    { href: "/category/k-beauty", icon: Sparkles, label: "K-Beauty" },
    { href: "/category/k-pop", icon: Music, label: "K-Pop" },
    { href: "/category/k-drama", icon: Heart, label: "K-Drama" },
    { href: "/category/k-movie", icon: Film, label: "K-Movie" },
    { href: "/category/k-food", icon: ChefHat, label: "K-Food" },
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-16 bottom-0 w-64 bg-dark-blue border-r border-gray-700 z-40 transform transition-transform lg:translate-x-0",
      "lg:static lg:top-0 lg:z-auto",
      className
    )}>
      <nav className="flex flex-col h-full px-4 py-6 space-y-6 overflow-y-auto">
        {/* Mobile close button */}
        {onClose && (
          <div className="lg:hidden flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary-purple rounded" />
              <span className="font-bold text-lg">StreamHub</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-sidebar">
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Main Navigation */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Browse
          </h3>
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg transition-colors",
                      isActive 
                        ? "bg-primary-purple text-white" 
                        : "hover:bg-card-bg text-gray-300 hover:text-white"
                    )}
                    data-testid={`link-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <Icon className={cn(
                      "mr-3 h-5 w-5",
                      item.label === "Live Now" && "text-live-red"
                    )} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Categories
          </h3>
          <ul className="space-y-2">
            {categoryItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg transition-colors",
                      isActive 
                        ? "bg-primary-purple text-white" 
                        : "hover:bg-card-bg text-gray-300 hover:text-white"
                    )}
                    data-testid={`link-category-${item.label.toLowerCase()}`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Following */}
        {isAuthenticated && following.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Following
            </h3>
            <div className="space-y-3">
              {following.map((channel: any) => (
                <Link
                  key={channel.id}
                  href={`/profile/${channel.username}`}
                  className="flex items-center space-x-3 px-3 py-2 hover:bg-card-bg rounded-lg cursor-pointer transition-colors"
                  data-testid={`link-channel-${channel.username}`}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={channel.profileImageUrl} alt={channel.username} />
                    <AvatarFallback>{channel.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{channel.username}</p>
                    <p className="text-xs text-gray-400">Offline</p>
                  </div>
                  {/* Online indicator would be dynamic based on stream status */}
                  {Math.random() > 0.7 && (
                    <div className="w-2 h-2 bg-success-green rounded-full" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
