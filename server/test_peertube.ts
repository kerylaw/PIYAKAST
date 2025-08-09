import { initializePeerTube, getPeerTubeClient } from "./peertube";
import { peertubeConfig } from "./peertube-config";

async function testCreateLiveStream() {
  try {
    console.log("Initializing PeerTube client...");
    const peertubeClient = initializePeerTube(peertubeConfig);
    await peertubeClient.authenticate();
    console.log("PeerTube client authenticated.");

    const liveStream = await peertubeClient.createLiveStream({
      channelId: 1, // Assuming channelId 1 exists
      name: 'Test Live Stream',
      description: 'This is a test live stream created from PIYAKast.',
      privacy: 1, // Public
      permanentLive: false,
      saveReplay: true
    });

    console.log("Live stream created successfully:", liveStream);
    if (liveStream) {
      console.log("LiveStream object is NOT undefined.");
      console.log("ID:", liveStream.id);
      console.log("UUID:", liveStream.uuid);
      console.log("Name:", liveStream.name);
      console.log("RTMP URL:", liveStream.rtmpUrl);
      console.log("Stream Key:", liveStream.streamKey);
    } else {
      console.log("LiveStream object IS undefined.");
    }
  } catch (error) {
    console.error("Error during test:", error);
  }
}

testCreateLiveStream();