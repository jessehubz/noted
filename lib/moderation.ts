/**
 * Basic server-side content moderation.
 * Rejects notes that contain dangerous/harmful content patterns.
 * This is a first-pass filter — not a replacement for human review at scale.
 */

const BLOCKED_PATTERNS = [
  // Violence / threats
  /\b(kill\s+(myself|yourself|them|him|her|everyone))\b/i,
  /\b(bomb\s+threat|school\s+shoot|mass\s+shoot)\b/i,
  /\b(i\s+want\s+to\s+die)\b/i,
  // Hate speech signals
  /\b(all\s+(blacks|whites|jews|muslims|asians)\s+(should|must|need\s+to))\b/i,
  // Doxxing patterns (phone numbers, addresses with unit numbers)
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // phone number
  // Child safety
  /\b(cp|child\s+porn|underage\s+nude)\b/i,
  // Spam / links (block all URLs)
  /https?:\/\/\S+/i,
  /www\.\S+/i,
  /\b\S+\.(com|net|org|io|co|xyz|tk|ml|ga|cf|gq|info|biz)\b/i,
  // Spam patterns
  /\b(buy\s+now|click\s+here|free\s+gift|earn\s+\$\d+)\b/i,
];

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
}

export function moderateContent(text: string): ModerationResult {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        reason: "This note was flagged for potentially harmful content and can't be posted.",
      };
    }
  }
  return { allowed: true };
}

/**
 * Adds a random offset to coordinates (within ~200m radius) so the user's
 * exact GPS position isn't revealed. The offset is random but consistent-looking
 * on the map.
 */
export function fuzzyLocation(
  lat: number,
  lng: number,
  radiusMeters: number = 200,
): { latitude: number; longitude: number } {
  // Random angle and distance (uniform within circle).
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.sqrt(Math.random()) * radiusMeters;

  // 1 degree latitude ≈ 111,320m.
  const dLat = (distance * Math.cos(angle)) / 111320;
  // 1 degree longitude varies with latitude.
  const dLng = (distance * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));

  return {
    latitude: Math.max(-90, Math.min(90, lat + dLat)),
    longitude: Math.max(-180, Math.min(180, lng + dLng)),
  };
}
