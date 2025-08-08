import { storage } from './storage';

// Track active streams with heartbeat mechanism
const activeStreams = new Map<string, {
  lastHeartbeat: number;
  viewerCount: number;
  missedHeartbeats: number; // Track consecutive missed heartbeats
  warningSent: boolean; // Track if warning was already sent
}>();

const HEARTBEAT_TIMEOUT = 25000; // 25 seconds - more generous for network delays
const CHECK_INTERVAL = 12000; // Check every 12 seconds
const GRACE_PERIOD = 10000; // 10 second grace period before final timeout

export function recordStreamHeartbeat(streamId: string, viewerCount: number = 0) {
  const existing = activeStreams.get(streamId);
  activeStreams.set(streamId, {
    lastHeartbeat: Date.now(),
    viewerCount,
    missedHeartbeats: 0, // Reset missed heartbeats on successful heartbeat
    warningSent: false // Reset warning flag
  });
  
  // Log recovery if stream was previously having issues
  if (existing && existing.missedHeartbeats > 0) {
    console.log(`✅ Stream ${streamId} heartbeat recovered (was missing ${existing.missedHeartbeats} beats)`);
  }
}

export function removeStream(streamId: string) {
  activeStreams.delete(streamId);
}

export function getActiveStreams(): string[] {
  const now = Date.now();
  const active: string[] = [];
  
  for (const [streamId, data] of Array.from(activeStreams.entries())) {
    if (now - data.lastHeartbeat < HEARTBEAT_TIMEOUT) {
      active.push(streamId);
    }
  }
  
  return active;
}

// Cleanup inactive streams with grace period and warnings
async function cleanupInactiveStreams() {
  try {
    const now = Date.now();
    const streamsToWarn: string[] = [];
    const streamsToDeactivate: string[] = [];
    
    // Find streams with network issues and apply grace period
    for (const [streamId, data] of Array.from(activeStreams.entries())) {
      const timeSinceLastHeartbeat = now - data.lastHeartbeat;
      
      if (timeSinceLastHeartbeat >= HEARTBEAT_TIMEOUT) {
        // Final timeout - deactivate stream
        streamsToDeactivate.push(streamId);
        activeStreams.delete(streamId);
      } else if (timeSinceLastHeartbeat >= (HEARTBEAT_TIMEOUT - GRACE_PERIOD) && !data.warningSent) {
        // Warning period - stream might have network issues
        streamsToWarn.push(streamId);
        // Mark warning as sent
        activeStreams.set(streamId, { ...data, warningSent: true, missedHeartbeats: data.missedHeartbeats + 1 });
      }
    }
    
    // Log warnings for streams with potential network issues
    for (const streamId of streamsToWarn) {
      console.log(`⚠️ Stream ${streamId} network issue detected (no heartbeat for ${Math.round((HEARTBEAT_TIMEOUT - GRACE_PERIOD)/1000)}s, ${Math.round(GRACE_PERIOD/1000)}s grace period remaining)`);
    }
    
    // Update database to mark streams as offline (after full grace period)
    for (const streamId of streamsToDeactivate) {
      await storage.updateStreamStatus(streamId, false);
      console.log(`🔴 Stream ${streamId} marked as offline (no heartbeat for ${Math.round(HEARTBEAT_TIMEOUT/1000)}s, including ${Math.round(GRACE_PERIOD/1000)}s grace period)`);
    }
    
    // Also check for streams marked as live in DB but not in active streams
    const dbLiveStreams = await storage.getLiveStreams();
    for (const stream of dbLiveStreams) {
      if (!activeStreams.has(stream.id)) {
        await storage.updateStreamStatus(stream.id, false);
        console.log(`🔴 Stream ${stream.id} marked as offline (not in active list)`);
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