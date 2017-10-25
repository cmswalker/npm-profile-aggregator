const { get } = require('superagent');

const timeout = 5000;

function fetch(uri, callback) {
  get(uri)
    .timeout({ response: timeout })
    .set('accept', 'json')
    .end((err, res = {}) => {
      const { body = {} } = res;
      const result = Object.keys(body).length ? body : (res.text || '');
      callback(err, result);
    });
}

module.exports = {
  get: fetch
};
