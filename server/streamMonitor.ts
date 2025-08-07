import { storage } from './storage';

// Track active streams with heartbeat mechanism
const activeStreams = new Map<string, {
  lastHeartbeat: number;
  viewerCount: number;
}>();

const HEARTBEAT_TIMEOUT = 30000; // 30 seconds
const CHECK_INTERVAL = 15000; // Check every 15 seconds

export function recordStreamHeartbeat(streamId: string, viewerCount: number = 0) {
  activeStreams.set(streamId, {
    lastHeartbeat: Date.now(),
    viewerCount
  });
}

export function removeStream(streamId: string) {
  activeStreams.delete(streamId);
}

export function getActiveStreams(): string[] {
  const now = Date.now();
  const active: string[] = [];
  
  for (const [streamId, data] of activeStreams.entries()) {
    if (now - data.lastHeartbeat < HEARTBEAT_TIMEOUT) {
      active.push(streamId);
    }
  }
  
  return active;
}

// Cleanup inactive streams from database
async function cleanupInactiveStreams() {
  try {
    const now = Date.now();
    const streamsToDeactivate: string[] = [];
    
    // Find streams that haven't sent heartbeat recently
    for (const [streamId, data] of activeStreams.entries()) {
      if (now - data.lastHeartbeat >= HEARTBEAT_TIMEOUT) {
        streamsToDeactivate.push(streamId);
        activeStreams.delete(streamId);
      }
    }
    
    // Update database to mark streams as offline
    for (const streamId of streamsToDeactivate) {
      await storage.updateStreamStatus(streamId, false);
      console.log(`🔴 Stream ${streamId} marked as offline (no heartbeat)`);
    }
    
    // Also check for streams marked as live in DB but not in active streams
    const dbLiveStreams = await storage.getLiveStreams();
    for (const stream of dbLiveStreams) {
      if (!activeStreams.has(stream.id)) {
        await storage.updateStreamStatus(stream.id, false);
        console.log(`🔴 Stream ${stream.id} marked as offline (not active)`);
      }
    }
    
  } catch (error) {
    console.error('Error cleaning up inactive streams:', error);
  }
}

// Start monitoring
let monitorInterval: NodeJS.Timeout;

export function startStreamMonitoring() {
  console.log('🎬 Starting stream monitoring...');
  
  // Initial cleanup
  cleanupInactiveStreams();
  
  // Set up periodic cleanup
  monitorInterval = setInterval(cleanupInactiveStreams, CHECK_INTERVAL);
}

export function stopStreamMonitoring() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    console.log('🛑 Stream monitoring stopped');
  }
}