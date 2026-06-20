import { loadVersion } from './pyapi.js';

// The single source of truth for the version is version-app.json in the project root.
// releases is sorted "newest first", so the current release is releases[0].
const data = await loadVersion();
const releases = Array.isArray(data.releases) ? data.releases : [];

export const releaseHistory = releases;
export const latestRelease = releases[0] ?? { version: '?', date: '?', changes: [] };

export const APP_VERSION = latestRelease.version;
export const APP_RELEASE_DATE = latestRelease.date;
