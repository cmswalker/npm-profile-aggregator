import { auto, map } from 'async';
import maybeTry from 'maybe-try';
import { get } from 'superagent';

const timeout = 5000;
const baseUri = 'https://www.npmjs.com';
const rootUrl = 'https://registry.cnpmjs.org';

export const fetch = (username, callback) => {
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

const fetcher = (uri, callback) => {
  get(uri)
    .timeout({ response: timeout })
    .set('accept', 'json')
    .end((err, res = {}) => {
      const { body = {} } = res;
      const result = Object.keys(body).length ? body : (res.text || '');
      callback(err, result);
    });
};

const endpoints = {
  byUser: `${rootUrl}/-/by-user`,
  byModule: `${rootUrl}`,
  downloads: function(start, end, pkgName) {
    return `https://api.npmjs.org/downloads/range/${start}:${end}/${pkgName}`;
  }
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
  fetcher(endpoint, (err, body) => {
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
  fetcher(endpoint, (err, body) => {
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
  fetcher(moduleEndpoint, (err, response) => {
    if (err) {
      return callback(err);
    }

    const { downloads = [] } = response;

    const month = downloads.length;
    const week = month - 7;
    const today = month - 1;

    const result = generateEmptyDownloads(); //lastDay, lastWeek, lastMonth

    // Must traverse backwards due to response
    for (let i = month - 1; i >= 0; i--) {
      const obj = downloads[i];
      const count = obj.downloads;

      if (i >= today) {
        result.lastDay += count;
      }

      if (i >= week) {
        result.lastWeek += count;
      }

      if (i && i <= month) {
        result.lastMonth += count;
      }
    }

    // NOTE: due to timezone differences, lastDay could be empty as the endpoint is not letting you dial backwards
    // to the full 24-hr time period of "the day" in UTC, in these cases, lastDay should just reflect yesterday.
    if (!result.lastDay) {
      const yesterday = downloads[downloads.length - 2];
      if (yesterday) {
          result.lastDay = yesterday.downloads;
      }
    }

    callback(null, result);
  });
}

function generateUserUrl(username) {
  return `${baseUri}/~${username}`;
}