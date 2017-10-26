import * as myNpmProfile from 'my-npm-profile';

import normalize from 'milligram';
import styles from './styles/index.styl';

function getProfile(username, callback) {
  myNpmProfile(username, callback);
}

function grab(selector) {
  return document.getElementById(selector);
}

const $app = grab('app');
const $input = grab('input');
const $submit = grab('submit');
const $loading = grab('loading');

const $profileSection = grab('profile-section');

let lastVal = ''

$input.addEventListener('keydown', function(event) {
    if (event.key === "Enter") {
      submit();
    }
});

function submit() {
  const { value } = $input;

  if (!value || value === lastVal) {
    return;
  }

  lastVal = value;

  showLoading(true);

  getProfile(value, (err, result) => {
    showLoading(false);

    if (err) {
      console.log('err', err);
      return;
    }

    populateProfile(result);
  });
}

$submit.onclick = (e) => {
  submit();
}

function showLoading(bool) {
  const display = bool ? 'block' : 'none';
  $loading.style.display = display;
}

function populateProfile(data) {
  console.log('data', data);

  // NOTE: reset;
  $profileSection.innerHTML = '';

  const { author, modules } = data;

  const userSection = `
    <div class="user-section">
      <div class="username">${author.username}</div>
      <div class="link">${author.link}</div>
      ${downloadSection(author.downloads)}
    </div>
  `.trim();

  function downloadSection({lastDay, lastWeek, lastMonth}) {
    return `
      <div class="downloads">
        Downloads
        <div class="last-day">Last Day: ${lastDay}</div>
        <div class="last-week">Last Week: ${lastWeek}</div>
        <div class="last-month">Last Month: ${lastMonth}</div>
      </div>
    `.trim();
  }

  const mods = modules.map((mod) => {
    console.log('mod', mod);
    return `
      <div class="module">
        <div class="module-name">${mod.name}</div>
        <div class="module-version">${mod.version}</div>
        <div class="module-description">${mod.description}</div>
        <div class="module-publish-time">${mod.publish_time}</div>
        <div class="repo">${(mod.repository || {}).url}</div>
        <div class="license">${mod.license}</div>
        ${downloadSection(mod.downloads)}
      </div>
    `;
  }).join('');

  const profileInfo = `${userSection}${mods}`;

  $profileSection.innerHTML = profileInfo;
}
