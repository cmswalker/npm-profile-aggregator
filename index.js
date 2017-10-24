const request = require('request');
const async = require('async');
const cheerio = require('cheerio');
const maybeTry = require('maybe-try');

const timeout = 2000;
const baseUri = 'https://www.npmjs.com';
const rootUrl = 'https://registry.cnpmjs.org';

const endpoints = {
  byUser: `${rootUrl}/-/by-user`,
  byModule: `${rootUrl}`
};

module.exports = fetch;

function fetch(username, callback) {
  if (!username) {
    return callback(new Error('username is required'));
  }

  async.auto({
    moduleList: (cb) => getModules(username, cb),
    userProfile: (cb) => getUserProfile(username, cb),
    downloads: ['moduleList', (results, cb) => getModuleListDownloads(results.moduleList, cb)],
    modules: ['moduleList', (results, cb) => getModuleListDetails(results.moduleList, cb)]
  }, (err, result) => {
    if (err) {
      return callback(err);
    }

    const finalResult = formatResult(username, result);
    callback(null, finalResult);
  });
};

function generateEmptyDownloads() {
  return {
    lastDay: 0,
    lastWeek: 0,
    lastMonth: 0
  };
}

function getUserProfile(username, callback) {
  const profileUrl = `${baseUri}/~${username}`;

  fetchProfile(profileUrl, maybeTry.callback(generateEmptyUser(username), (err, profile) => {
    return callback(err, profile.result);
  }));
}

function generateEmptyUser(username) {
  return {
    username,
    avatar: '',
    homepage: '',
    github: '',
    twitter: '',
    freenode: ''
  };
}

function fetchProfile(url, callback) {
  request.get(url, (err, result, body) => {
    if (err) {
      return callback(err);
    }

    const $ = cheerio.load(body);

		let avatar = $('.avatar img').attr('src');
		avatar = avatar ? avatar.replace(/^(https:\/\/)s\./, '$1').replace(/&default=retro$/, '') : null;

		const userData = {
			username: $('.fullname').text() || null,
			avatar,
			homepage: $('.homepage a').attr('href') || null,
			github: $('.github a').text().slice(1) || null,
			twitter: $('.twitter a').text().slice(1) || null,
			freenode: $('.freenode a').text() || null
		};

    callback(null, userData);
  });
}

function formatResult(username, result) {
  const finalResult = {
    modules: []
  };

  const authorDownlods = generateEmptyDownloads();

  result.modules.forEach((module) => {
    const { name } = module;

    const moduleDownloads = result.downloads[name] || generateEmptyDownloads();
    // Tag module download data
    module.downloads = moduleDownloads;

    // Tag additional maintainer and contributor data
    module.contributors = module.contributors || [];
    module.maintainers = module.maintainers || [];
    module.maintainers.forEach((maintainer) => {
      const { name } = maintainer;
      maintainer.link = generateUserUrl(name);
    });

    // Tag additional author download data
    Object.keys(authorDownlods).forEach((key) => {
      const moduleVal = moduleDownloads[key];
      if (!moduleVal) {
        return;
      }
      authorDownlods[key] += moduleVal;
    });

    finalResult.modules.push(module);
  });

  finalResult.author = Object.assign({}, result.userProfile, {
    username,
    link: generateUserUrl(username),
    downloads: authorDownlods
  });

  return finalResult;
}

function checkJson(body) {
  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  return body;
}

function getModules(username, callback) {
  const userEndpoint = `${endpoints.byUser}/${username}`;

  getModuleList(username, userEndpoint, maybeTry.callback([], (err, list) => {
    callback(err, list.result);
  }));
}

function getModuleList(username, endpoint, callback) {
  request.get(endpoint, { timeout }, (err, response, body) => {
    if (err) {
      return callback(err);
    }

    body = checkJson(body);

    const moduleList = body[username];
    callback(null, moduleList);
  });
}

function generateModuleDetail() {
  return {
    name: '',
    version: '',
    description: '',
    author: {},
    main: '',
    contributors: [],
    collaborators: [],
    license: '',
    homepage: '',
    repository: {}
  }
}

function getModuleListDetails(moduleList, callback) {
  async.map(moduleList, (moduleName, cb) => {
    const moduleEndpoint = `${endpoints.byModule}/${moduleName}/latest`;
    getModuleDetail(moduleEndpoint, maybeTry.callback(generateModuleDetail(), (err, detail) => {
      cb(err, detail.result);
    }));
  }, (err, list) => {
    if (err) {
      return callback(err);
    }

    list = list.filter(l => !!l.name);
    callback(null, list);
  });
}

function getModuleDetail(endpoint, callback) {
  request.get(endpoint, {timeout}, (err, response, body) => {
    if (err) {
      return callback(err);
    }

    body = checkJson(body);

    // NOTE: 404s
    if (body.error && body.reason) {
      body = {};
    }

    callback(null, body);
  });
}

const downloadTags = {
  lastDay: 'daily-downloads',
  lastWeek: 'weekly-downloads',
  lastMonth: 'monthly-downloads'
};

function getModuleListDownloads(moduleList, callback) {
  async.map(moduleList, (moduleName, cb) => {
      const moduleEndpoint = `${baseUri}/${moduleName}`;
      getModuleDownloads(moduleEndpoint, maybeTry.callback(generateEmptyDownloads(), (err, downloads) => {
        if (err) {
          return cb(err);
        }

        downloads = downloads.result;
        return cb(null, { moduleName, downloads });
      }));
  }, (err, downloadResults) => {
    if (err) {
      return callback(err);
    }

    const formattedResults = downloadResults.reduce((result, data) => {
      const { moduleName, downloads } = data;
      result[moduleName] = downloads;
      return result;
    }, {});

    callback(null, formattedResults);
  });
}

function getModuleDownloads(moduleEndpoint, callback) {
  request.get(moduleEndpoint, { timeout }, (err, response, body) => {
    if (err) {
      return callback(err);
    }

    const $ = cheerio.load(body);

    const downloads = Object.keys(downloadTags).reduce((result, tag) => {
      const downloadCount = $(`.${downloadTags[tag]}`).text();
      result[tag] = Number(downloadCount);
      return result;
    }, {});

    callback(null, downloads);
  });
}

function generateUserUrl(username) {
  return `${baseUri}/~${username}`;
}
