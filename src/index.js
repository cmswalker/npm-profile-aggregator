import { fetch } from 'npm-profile-aggregator';

import normalize from 'milligram';
import styles from './styles/index.styl';

const getProfile = (username, callback) => {
  fetch(username, callback);
}

const grab = (selector) => {
  return document.getElementById(selector);
}

const checkLocation = () => {
  const queries = window.location.search.split('?');
  const queryStruct = queries.reduce((result, curr) => {
    const [ key, value ] = curr.split('=');

    if (key !== undefined && value !== undefined) {
      result[key] = value.toString();
    }

    return result;
  }, {});

  if (queryStruct.profile) {
    submit(queryStruct.profile.trim());
  }
}

const $app = grab('app');
const $input = grab('input');
const $submit = grab('submit');
const $loading = grab('loading');

const $profileSection = grab('profile-section');

let lastVal = ''

checkLocation();

$input.addEventListener('keydown', function(event) {
    if (event.key === "Enter") {
      submit(getValue());
    }
});

const getValue = () => {
  const { value } = $input;
  return value.trim();
}

function submit(value) {
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
  submit(getValue());
}

function showLoading(bool) {
  const display = bool ? 'block' : 'none';
  $loading.style.display = display;
}

function link(link) {
  return `<a href="${link}">${link}</a>`;
}

function populateProfile(data) {
  console.log('Result Data', data);

  // NOTE: reset;
  $profileSection.innerHTML = '';

  const { author, modules } = data;

  const userSection = `
    <div class="section">
      <div class="user-section">
        <div class="username sub-title">${author.username}</div>
        <div class="link">
          ${link(author.link)}
        </div>
        <div>Total Modules: ${modules.length}</div>
      </div>

      ${downloadSection(author.downloads)}
    </div>
  `.trim();

  function downloadSection({lastDay, lastWeek, lastMonth}) {
    return `
      <div class="downloads">
        <div class="sub-title">Downloads</div>
        <div class="last-day">Last Day: ${lastDay}</div>
        <div class="last-week">Last Week: ${lastWeek}</div>
        <div class="last-month">Last Month: ${lastMonth}</div>
      </div>
    `.trim();
  }

function formatDate(ms) {
  const date = new Date(ms);

  const monthNames = [
    'January', 'February', 'March',
    'April', 'May', 'June', 'July',
    'August', 'September', 'October',
    'November', 'December'
  ];

  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  return day + ' ' + monthNames[monthIndex] + ' ' + year;
}

  const mods = modules.map((mod) => {
    const modUrl = ((mod.repository || {}).url) || '';
    return `
      <div class="module-section section">
        <div class="module-main">
          <span class="module-name sub-title">${mod.name}</span>
          <span class="module-version">${mod.version}</span>
          <div class="module-description">${mod.description}</div>
        </div>
        ${downloadSection(mod.downloads)}
        <div class=module-sub>
          <div class="module-publish-time">Since: ${formatDate(mod.publish_time)}</div>
          <div class="repo">${link(modUrl.replace(/git\+/, ''))}</div>
          <div class="license">License: ${mod.license}</div>
        </div>
      </div>
    `;
  }).join('');

  const profileInfo = `
    ${userSection}
    ${mods}
    `.trim();

  $profileSection.innerHTML = profileInfo;
}
