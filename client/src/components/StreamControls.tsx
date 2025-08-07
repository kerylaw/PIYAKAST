import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, StopCircle, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StreamControlsProps {
  streamId: string;
  isLive: boolean;
  isOwner: boolean;
}

export function StreamControls({ streamId, isLive, isOwner }: StreamControlsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startStreamMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/streams/${streamId}/start`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streams", streamId] });
      queryClient.invalidateQueries({ queryKey: ["/api/streams/live"] });
      toast({
        title: "라이브 방송 시작",
        description: "라이브 방송이 시작되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "방송 시작 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stopStreamMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/streams/${streamId}/stop`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streams", streamId] });
      queryClient.invalidateQueries({ queryKey: ["/api/streams/live"] });
      toast({
        title: "라이브 방송 종료",
        description: "라이브 방송이 종료되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "방송 종료 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!isOwner) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {!isLive ? (
        <Button
          onClick={() => startStreamMutation.mutate()}
          disabled={startStreamMutation.isPending}
          className="bg-green-600 hover:bg-green-700 text-white"
          data-testid="button-start-stream"
        >
          {startStreamMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <PlayCircle className="w-4 h-4 mr-2" />
          )}
          방송 시작
        </Button>
      ) : (
        <Button
          onClick={() => stopStreamMutation.mutate()}
          disabled={stopStreamMutation.isPending}
          className="bg-red-600 hover:bg-red-700 text-white"
          data-testid="button-stop-stream"
        >
          {stopStreamMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <StopCircle className="w-4 h-4 mr-2" />
          )}
          방송 종료
        </Button>
      )}
    </div>
  );
}