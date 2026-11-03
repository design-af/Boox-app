// Checks GitHub Releases for a newer build and offers the APK.
// Releases are tagged "build-<versionCode>" by .github/workflows/release.yml.
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

const REPO = import.meta.env.VITE_GH_REPO; // "owner/name", injected at build time

export async function currentBuild() {
  if (!Capacitor.isNativePlatform()) return { version: 'web', build: 0 };
  const info = await App.getInfo(); // on Android, info.build = versionCode
  return { version: info.version, build: Number(info.build) || 0 };
}

export async function checkForUpdate() {
  if (!REPO) return { available: false, reason: 'No repo configured' };
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) return { available: false, reason: `GitHub returned ${res.status}` };

  const release = await res.json();
  const latest = Number((release.tag_name || '').replace(/^build-/, '')) || 0;
  const asset = (release.assets || []).find((a) => a.name.endsWith('.apk'));
  const { build } = await currentBuild();

  return {
    available: Boolean(asset) && latest > build,
    latest,
    current: build,
    url: asset?.browser_download_url,
  };
}

// Opens the APK download; Android then shows its install prompt.
export async function installUpdate(url) {
  await Browser.open({ url });
}
