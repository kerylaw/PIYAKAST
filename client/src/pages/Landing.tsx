import { Button } from "@/components/ui/button";
import { Video, Play, Users, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark-navy text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-purple/20 via-dark-navy to-dark-blue" />
        
        {/* Navigation */}
        <header className="relative z-10 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-primary-purple" />
              <span className="font-bold text-xl">StreamHub</span>
            </div>
            <Button
              onClick={() => window.location.href = "/auth"}
              className="bg-primary-purple hover:bg-purple-700"
              data-testid="button-get-started"
            >
              Get Started
            </Button>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Stream Your
              <span className="block bg-gradient-to-r from-primary-purple to-primary-indigo bg-clip-text text-transparent">
                Passion
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Join thousands of creators sharing their content with the world. 
              Stream live, upload videos, and build your community on StreamHub.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => window.location.href = "/auth"}
                className="bg-primary-purple hover:bg-purple-700 text-lg px-8 py-4"
                data-testid="button-start-streaming"
              >
                <Video className="mr-2 h-5 w-5" />
                Start Streaming
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-white hover:bg-card-bg text-lg px-8 py-4"
                data-testid="button-watch-streams"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Streams
              </Button>
            </div>
          </div>
        </div>

        {/* Floating video preview */}
        <div className="absolute top-1/2 right-10 transform -translate-y-1/2 hidden lg:block">
          <div className="w-80 h-48 bg-card-bg rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&w=320&h=180&fit=crop"
                alt="Live stream preview"
                className="w-full h-32 object-cover"
              />
              <div className="absolute top-2 left-2 bg-live-red text-white px-2 py-1 rounded text-xs font-medium">
                LIVE
              </div>
              <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                1.2K
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm mb-1">Epic Gaming Session</h3>
              <p className="text-gray-400 text-xs">StreamerPro • Gaming</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-dark-blue">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose StreamHub?</h2>
            <p className="text-xl text-gray-300">Everything you need to create, share, and grow your audience</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-card-bg rounded-2xl border border-gray-700">
              <div className="w-16 h-16 bg-primary-purple/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Video className="h-8 w-8 text-primary-purple" />
              </div>
              <h3 className="text-xl font-bold mb-4">Live Streaming</h3>
              <p className="text-gray-300">
                Stream in high quality with real-time chat, donations, and interactive features 
                to engage with your audience.
              </p>
            </div>

            <div className="text-center p-8 bg-card-bg rounded-2xl border border-gray-700">
              <div className="w-16 h-16 bg-primary-indigo/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Play className="h-8 w-8 text-primary-indigo" />
              </div>
              <h3 className="text-xl font-bold mb-4">Video On Demand</h3>
              <p className="text-gray-300">
                Upload and share your pre-recorded content with a global audience. 
                Build your video library and grow your following.
              </p>
            </div>

            <div className="text-center p-8 bg-card-bg rounded-2xl border border-gray-700">
              <div className="w-16 h-16 bg-success-green/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-success-green" />
              </div>
              <h3 className="text-xl font-bold mb-4">Community Building</h3>
              <p className="text-gray-300">
                Connect with your fans through comments, live chat, and community features. 
                Build lasting relationships with your audience.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join StreamHub today and become part of a thriving community of creators and viewers.
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            className="bg-gradient-to-r from-primary-purple to-primary-indigo hover:from-purple-700 hover:to-indigo-700 text-lg px-12 py-4"
            data-testid="button-join-now"
          >
            <Zap className="mr-2 h-5 w-5" />
            Join StreamHub Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Video className="h-6 w-6 text-primary-purple" />
            <span className="font-bold text-lg">StreamHub</span>
          </div>
          <p className="text-gray-400">
            © 2024 StreamHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
