const { auto, map } = require('async');
const maybeTry = require('maybe-try');

const { get } = require('./request');

const baseUri = 'https://www.npmjs.com';
const rootUrl = 'https://registry.cnpmjs.org';

const endpoints = {
  byUser: `${rootUrl}/-/by-user`,
  byModule: `${rootUrl}`,
  downloads: function(start, end, pkgName) {
    return `https://api.npmjs.org/downloads/range/${start}:${end}/${pkgName}`;
  }
};

module.exports = fetch;

function fetch(username, callback) {
  if (!username) {
    return callback(new Error('username is required'));
  }

  auto({
    moduleList: (cb) => getModules(username, cb),
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

  finalResult.author = {
    username,
    link: generateUserUrl(username),
    downloads: authorDownlods
  };

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
  get(endpoint, (err, body) => {
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
  map(moduleList, (moduleName, cb) => {
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
  get(endpoint, (err, body) => {
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

function generateDates(daysFromStart) {
  daysFromStart = daysFromStart || 0;

  var today = new Date();
  var searchDate = new Date();
  var search = new Date(searchDate.setDate(searchDate.getDate() - daysFromStart));

  var dd = today.getDate();
  var mm = today.getMonth() + 1;

  var sdd = search.getDate();
  var smm = search.getMonth() + 1;

  var yyyy = today.getFullYear();
  var syyyy = search.getFullYear();

  checkDates(dd, mm);
  checkDates(sdd, smm);

  var start = [syyyy, smm, sdd].join('-');
  var end = [yyyy, mm, dd].join('-');

  return {
    start,
    end
  };
}

function checkDates(dd, mm) {
  if (dd < 10) {
      dd= '0' + dd;
  }
  if (mm < 10) {
      mm= '0' + mm;
  }
}

function getModuleListDownloads(moduleList, callback) {
  map(moduleList, (moduleName, cb) => {
      const { start, end } = generateDates(30);
      const moduleEndpoint = endpoints.downloads(start, end, moduleName);

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
  get(moduleEndpoint, (err, response) => {
    if (err) {
      return callback(err);
    }

    const { downloads = [] } = response;
    const today = 1;
    const week = 7;
    const month = 30;

    const result = generateEmptyDownloads(); //lastDay, lastWeek, lastMonth

    downloads.forEach((obj, i) => {
      const count = obj.downloads;
      if (i <= today) {
        result.lastDay += count;
      }

      if (i <= week) {
        result.lastWeek += count;
      }

      if (i <= month) {
        result.lastMonth += count;
      }
    });

    callback(null, result);
  });
}

function generateUserUrl(username) {
  return `${baseUri}/~${username}`;
}
