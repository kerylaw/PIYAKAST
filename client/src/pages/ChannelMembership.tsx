import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import MembershipTierCard from "@/components/MembershipTierCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Crown, Plus, Settings, Users, DollarSign } from "lucide-react";

export default function ChannelMembership() {
  const { channelId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTierForm, setNewTierForm] = useState({
    name: "",
    description: "",
    monthlyPrice: "",
    yearlyPrice: "",
    color: "#6366f1",
    emoji: "",
  });

  const isOwner = user?.id === channelId;

  // Fetch channel info
  const { data: channel } = useQuery<any>({
    queryKey: [`/api/users/${channelId}`],
    enabled: !!channelId,
  });

  // Fetch membership tiers
  const { data: tiers = [], isLoading: tiersLoading } = useQuery<any[]>({
    queryKey: [`/api/channels/${channelId}/membership-tiers`],
    enabled: !!channelId,
  });

  // Fetch current membership (for logged in users)
  const { data: currentMembership } = useQuery<any>({
    queryKey: [`/api/channels/${channelId}/membership`],
    enabled: isAuthenticated && !!channelId && !isOwner,
  });

  // Fetch channel revenue (for owners)
  const { data: revenue } = useQuery<any>({
    queryKey: [`/api/channels/${channelId}/revenue`],
    enabled: isOwner && !!channelId,
  });

  const createTierMutation = useMutation({
    mutationFn: async (tierData: any) => {
      await apiRequest("POST", `/api/channels/${channelId}/membership-tiers`, {
        ...tierData,
        monthlyPrice: parseInt(tierData.monthlyPrice),
        yearlyPrice: tierData.yearlyPrice ? parseInt(tierData.yearlyPrice) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/channels/${channelId}/membership-tiers`] 
      });
      setShowCreateDialog(false);
      setNewTierForm({
        name: "",
        description: "",
        monthlyPrice: "",
        yearlyPrice: "",
        color: "#6366f1",
        emoji: "",
      });
      toast({
        title: "Tier Created",
        description: "New membership tier has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create membership tier.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTierForm.name.trim() || !newTierForm.monthlyPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in the tier name and monthly price.",
        variant: "destructive",
      });
      return;
    }
    createTierMutation.mutate(newTierForm);
  };

  if (!channelId) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Channel not found</h1>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Channel Header */}
        <div className="flex items-center space-x-6 mb-8">
          <Avatar className="w-20 h-20">
            <AvatarImage src={channel?.profileImageUrl || ""} alt={channel?.username || ""} />
            <AvatarFallback className="text-2xl">
              {channel?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <Crown className="h-8 w-8 text-primary-purple" />
              <span>{channel?.username || "Channel"} Membership</span>
            </h1>
            <p className="text-gray-400 mt-2">
              {isOwner 
                ? "Manage your channel memberships and engage with your community"
                : "Join to support your favorite creator and get exclusive benefits"
              }
            </p>
          </div>
          {isOwner && (
            <div className="flex space-x-2">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-primary-purple hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tier
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Membership Tier</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateTier} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Tier Name</Label>
                      <Input
                        id="name"
                        value={newTierForm.name}
                        onChange={(e) => setNewTierForm({ ...newTierForm, name: e.target.value })}
                        placeholder="e.g., Gold Member"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newTierForm.description}
                        onChange={(e) => setNewTierForm({ ...newTierForm, description: e.target.value })}
                        placeholder="Describe the benefits of this tier"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="monthlyPrice">Monthly Price (₩)</Label>
                        <Input
                          id="monthlyPrice"
                          type="number"
                          min="1000"
                          value={newTierForm.monthlyPrice}
                          onChange={(e) => setNewTierForm({ ...newTierForm, monthlyPrice: e.target.value })}
                          placeholder="5000"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="yearlyPrice">Yearly Price (₩)</Label>
                        <Input
                          id="yearlyPrice"
                          type="number"
                          min="10000"
                          value={newTierForm.yearlyPrice}
                          onChange={(e) => setNewTierForm({ ...newTierForm, yearlyPrice: e.target.value })}
                          placeholder="50000 (optional)"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="color">Tier Color</Label>
                        <Input
                          id="color"
                          type="color"
                          value={newTierForm.color}
                          onChange={(e) => setNewTierForm({ ...newTierForm, color: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="emoji">Emoji (optional)</Label>
                        <Input
                          id="emoji"
                          value={newTierForm.emoji}
                          onChange={(e) => setNewTierForm({ ...newTierForm, emoji: e.target.value })}
                          placeholder="👑"
                          maxLength={2}
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-4">
                      <Button type="submit" disabled={createTierMutation.isPending} className="flex-1">
                        {createTierMutation.isPending ? "Creating..." : "Create Tier"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowCreateDialog(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Owner Dashboard */}
        {isOwner && revenue && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₩{revenue?.totalRevenue?.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{revenue?.activeSubscriptions || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{revenue?.totalSubscriptions || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Current Membership Status */}
        {!isOwner && currentMembership?.subscription && (
          <Card className="mb-8 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-primary" />
                <span>Your Membership</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {currentMembership?.tier?.name || "Subscriber"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Active since {new Date(currentMembership?.subscription?.startDate || Date.now()).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Membership Tiers */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-6">Membership Tiers</h2>
            {tiersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card-bg rounded-xl p-6 animate-pulse">
                    <div className="h-6 bg-gray-700 rounded mb-4" />
                    <div className="h-4 bg-gray-700 rounded mb-2" />
                    <div className="h-4 bg-gray-700 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : tiers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(tiers as any[]).map((tier: any) => (
                  <MembershipTierCard
                    key={tier.id}
                    tier={tier}
                    channelName={channel?.username || ""}
                    isCurrentTier={currentMembership?.tier?.id === tier.id}
                    onJoin={() => {
                      queryClient.invalidateQueries({ 
                        queryKey: [`/api/channels/${channelId}/membership`] 
                      });
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Crown className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Membership Tiers</h3>
                  <p className="text-gray-400 text-center">
                    {isOwner 
                      ? "Create your first membership tier to start offering exclusive benefits to your community."
                      : "This creator hasn't set up membership tiers yet."
                    }
                  </p>
                  {isOwner && (
                    <Button 
                      className="mt-4"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Tier
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}