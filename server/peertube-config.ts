import { PeerTubeConfig } from './peertube';

// PeerTube configuration
export const peertubeConfig: PeerTubeConfig = {
  url: 'http://127.0.0.1:9000', // Default PeerTube port
  username: 'kery73',
  password: 'Yoyeom75!'
};

// PeerTube categories mapping
export const peertubeCategories = {
  'K-Beauty': 1,
  'K-Pop': 2,
  'K-Drama': 3,
  'K-Movie': 4,
  'K-Food': 5,
  'Gaming': 6,
  'Technology': 7,
  'Education': 8,
  'Entertainment': 9,
  'Music': 10
} as const;

// PeerTube privacy settings
export const peertubePrivacy = {
  PUBLIC: 1,
  UNLISTED: 2,
  PRIVATE: 3
} as const;

// PeerTube license types
export const peertubeLicense = {
  UNKNOWN: 0,
  CC_BY: 1,
  CC_BY_SA: 2,
  CC_BY_ND: 3,
  CC_BY_NC: 4,
  CC_BY_NC_SA: 5,
  CC_BY_NC_ND: 6,
  CC_0: 7,
  PUBLIC_DOMAIN: 8
} as const;