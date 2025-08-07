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
      console.log("Starting stream:", streamId, "isOwner:", isOwner);
      const response = await apiRequest("POST", `/api/streams/${streamId}/start`);
      const text = await response.text();
      console.log("Start stream response:", text);
      try {
        return JSON.parse(text);
      } catch {
        return { message: text || "Stream started" };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/streams", streamId] });
      queryClient.invalidateQueries({ queryKey: ["/api/streams/live"] });
      toast({
        title: "라이브 방송 시작",
        description: "라이브 스트림 페이지로 이동합니다.",
      });
      // 스트림 시작 후 라이브 페이지로 이동
      setTimeout(() => {
        window.location.href = `/stream/${streamId}`;
      }, 1000);
    },
    onError: (error: Error) => {
      console.error("Start stream error:", error);
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
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return { message: text || "Stream stopped" };
      }
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
      console.error("Stop stream error:", error);
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