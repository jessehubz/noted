/**
 * Free, no-API-key vector basemap styles from OpenFreeMap
 * (https://openfreemap.org). "Dark" gives the app its moody, confessional
 * feel; "positron" is used as the light-mode counterpart.
 */
export const MAP_STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";
export const MAP_STYLE_LIGHT = "https://tiles.openfreemap.org/styles/positron";

export const DEFAULT_CENTER: [number, number] = [121.0, 14.6];
export const DEFAULT_ZOOM = 12;

/** Notes within this many meters (roughly) get grouped into one marker. */
export const CLUSTER_RADIUS_PX = 50;
export const CLUSTER_MAX_ZOOM = 18;
