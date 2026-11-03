import { App } from '@capacitor/app';
import { currentBuild, checkForUpdate, installUpdate } from './updater.js';

const $ = (id) => document.getElementById(id);

async function showVersion() {
  const { version, build } = await currentBuild();
  $('version').textContent = build ? `v${version} (build ${build})` : 'Running in a browser';
}

async function runUpdateCheck({ quiet } = { quiet: true }) {
  try {
    const result = await checkForUpdate();
    if (result.available) {
      $('update-text').textContent = `Build ${result.latest} is available`;
      $('update-btn').onclick = () => installUpdate(result.url);
      $('update-banner').hidden = false;
    } else if (!quiet) {
      alert(result.reason || 'You have the latest build.');
    }
  } catch (err) {
    if (!quiet) alert(`Update check failed: ${err.message}`);
  }
}

$('check-btn').addEventListener('click', () => runUpdateCheck({ quiet: false }));

// Check on launch and whenever the app comes back to the foreground.
App.addListener('appStateChange', ({ isActive }) => isActive && runUpdateCheck());

showVersion();
runUpdateCheck();
