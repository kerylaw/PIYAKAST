import { useState } from "react";
import { Link } from "wouter";
import { Search, Video, Menu, X, Settings, User, Upload, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import UploadModal from "./UploadModal";
import LiveStreamModal from "./LiveStreamModal";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLiveStreamModal, setShowLiveStreamModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log("Searching for:", searchQuery);
    }
  };

  return (
    <>
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:text-primary-purple"
                onClick={onMobileMenuToggle}
                data-testid="button-mobile-menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
                <Video className="h-8 w-8 text-primary-purple" />
                <span className="font-bold text-xl">PIYAKast</span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <Input
                  type="search"
                  placeholder="Search streams, videos, creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-card-bg border-gray-700 text-white placeholder-gray-400"
                  data-testid="input-search"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </form>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Button
                    onClick={() => setShowLiveStreamModal(true)}
                    className="hidden md:flex items-center space-x-2 bg-live-red hover:bg-red-700"
                    data-testid="button-go-live"
                  >
                    <Video className="h-4 w-4" />
                    <span>Go Live</span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.profileImageUrl || ""} alt={user?.username} />
                          <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-elevated border-gray-700" align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/profile/${user?.username}`} className="flex items-center cursor-pointer" data-testid="link-profile">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowUploadModal(true)} data-testid="button-upload-video">
                        <Upload className="mr-2 h-4 w-4" />
                        <span>Upload Video</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowLiveStreamModal(true)} data-testid="button-go-live-menu">
                        <Video className="mr-2 h-4 w-4" />
                        <span>Go Live</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={toggleTheme} data-testid="button-toggle-theme">
                        {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                        <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => window.location.href = "/api/logout"} data-testid="button-logout">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button
                  onClick={() => window.location.href = "/api/login"}
                  className="bg-primary-purple hover:bg-purple-700"
                  data-testid="button-login"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <UploadModal open={showUploadModal} onOpenChange={setShowUploadModal} />
      <LiveStreamModal isOpen={showLiveStreamModal} onClose={() => setShowLiveStreamModal(false)} />
    </>
  );
}
