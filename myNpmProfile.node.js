(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["myNpmProfile"] = factory();
	else
		root["myNpmProfile"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "fetch", function() { return fetch; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_async__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_async___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_async__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_maybe_try__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_maybe_try___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_maybe_try__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_superagent__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_superagent___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_superagent__);




var timeout = 5000;
var baseUri = 'https://www.npmjs.com';
var rootUrl = 'https://registry.cnpmjs.org';

var fetch = function fetch(username, callback) {
  if (!username) {
    return callback(new Error('username is required'));
  }

  Object(__WEBPACK_IMPORTED_MODULE_0_async__["auto"])({
    moduleList: function moduleList(cb) {
      return getModules(username, cb);
    },
    downloads: ['moduleList', function (results, cb) {
      return getModuleListDownloads(results.moduleList, cb);
    }],
    modules: ['moduleList', function (results, cb) {
      return getModuleListDetails(results.moduleList, cb);
    }]
  }, function (err, result) {
    if (err) {
      return callback(err);
    }

    var finalResult = formatResult(username, result);
    callback(null, finalResult);
  });
};

var fetcher = function fetcher(uri, callback) {
  Object(__WEBPACK_IMPORTED_MODULE_2_superagent__["get"])(uri).timeout({ response: timeout }).set('accept', 'json').end(function (err) {
    var res = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _res$body = res.body,
        body = _res$body === undefined ? {} : _res$body;

    var result = Object.keys(body).length ? body : res.text || '';
    callback(err, result);
  });
};

var endpoints = {
  byUser: rootUrl + '/-/by-user',
  byModule: '' + rootUrl,
  downloads: function downloads(start, end, pkgName) {
    return 'https://api.npmjs.org/downloads/range/' + start + ':' + end + '/' + pkgName;
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
  var finalResult = {
    modules: []
  };

  var authorDownlods = generateEmptyDownloads();

  result.modules.forEach(function (module) {
    var name = module.name;


    var moduleDownloads = result.downloads[name] || generateEmptyDownloads();
    // Tag module download data
    module.downloads = moduleDownloads;

    // Tag additional maintainer and contributor data
    module.contributors = module.contributors || [];
    module.maintainers = module.maintainers || [];
    module.maintainers.forEach(function (maintainer) {
      var name = maintainer.name;

      maintainer.link = generateUserUrl(name);
    });

    // Tag additional author download data
    Object.keys(authorDownlods).forEach(function (key) {
      var moduleVal = moduleDownloads[key];
      if (!moduleVal) {
        return;
      }
      authorDownlods[key] += moduleVal;
    });

    finalResult.modules.push(module);
  });

  finalResult.author = {
    username: username,
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
  var userEndpoint = endpoints.byUser + '/' + username;

  getModuleList(username, userEndpoint, __WEBPACK_IMPORTED_MODULE_1_maybe_try___default.a.callback([], function (err, list) {
    callback(err, list.result);
  }));
}

function getModuleList(username, endpoint, callback) {
  fetcher(endpoint, function (err, body) {
    if (err) {
      return callback(err);
    }

    body = checkJson(body);

    var moduleList = body[username];
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
  };
}

function getModuleListDetails(moduleList, callback) {
  Object(__WEBPACK_IMPORTED_MODULE_0_async__["map"])(moduleList, function (moduleName, cb) {
    var moduleEndpoint = endpoints.byModule + '/' + moduleName + '/latest';
    getModuleDetail(moduleEndpoint, __WEBPACK_IMPORTED_MODULE_1_maybe_try___default.a.callback(generateModuleDetail(), function (err, detail) {
      cb(err, detail.result);
    }));
  }, function (err, list) {
    if (err) {
      return callback(err);
    }

    list = list.filter(function (l) {
      return !!l.name;
    });
    callback(null, list);
  });
}

function getModuleDetail(endpoint, callback) {
  fetcher(endpoint, function (err, body) {
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

var downloadTags = {
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
    start: start,
    end: end
  };
}

function checkDates(dd, mm) {
  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }
}

function getModuleListDownloads(moduleList, callback) {
  Object(__WEBPACK_IMPORTED_MODULE_0_async__["map"])(moduleList, function (moduleName, cb) {
    var _generateDates = generateDates(30),
        start = _generateDates.start,
        end = _generateDates.end;

    var moduleEndpoint = endpoints.downloads(start, end, moduleName);

    getModuleDownloads(moduleEndpoint, __WEBPACK_IMPORTED_MODULE_1_maybe_try___default.a.callback(generateEmptyDownloads(), function (err, downloads) {
      if (err) {
        return cb(err);
      }

      downloads = downloads.result;
      return cb(null, { moduleName: moduleName, downloads: downloads });
    }));
  }, function (err, downloadResults) {
    if (err) {
      return callback(err);
    }

    var formattedResults = downloadResults.reduce(function (result, data) {
      var moduleName = data.moduleName,
          downloads = data.downloads;

      result[moduleName] = downloads;
      return result;
    }, {});

    callback(null, formattedResults);
  });
}

function getModuleDownloads(moduleEndpoint, callback) {
  fetcher(moduleEndpoint, function (err, response) {
    if (err) {
      return callback(err);
    }

    var _response$downloads = response.downloads,
        downloads = _response$downloads === undefined ? [] : _response$downloads;


    var month = downloads.length;
    var week = month - 7;
    var today = month - 1;

    var result = generateEmptyDownloads(); //lastDay, lastWeek, lastMonth

    // Must traverse backwards due to response
    for (var i = month - 1; i >= 0; i--) {
      var obj = downloads[i];
      var count = obj.downloads;

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
      var yesterday = downloads[downloads.length - 2];
      if (yesterday) {
        result.lastDay = yesterday.downloads;
      }
    }

    callback(null, result);
  });
}

function generateUserUrl(username) {
  return baseUri + '/~' + username;
}

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("async");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("maybe-try");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("superagent");

/***/ })
/******/ ]);
});
//# sourceMappingURL=myNpmProfile.node.js.map