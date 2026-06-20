import { loadVersion } from './pyapi.js';

// Єдине джерело правди про версію — version-app.json у корені проєкту.
// releases відсортовано «найновіша зверху», тож поточний реліз — це releases[0].
const data = await loadVersion();
const releases = Array.isArray(data.releases) ? data.releases : [];

export const releaseHistory = releases;
export const latestRelease = releases[0] ?? { version: '?', date: '?', changes: [] };

export const APP_VERSION = latestRelease.version;
export const APP_RELEASE_DATE = latestRelease.date;
