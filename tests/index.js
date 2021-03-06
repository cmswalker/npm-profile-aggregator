const assert = require('assert');
const sinon = require('sinon');
const request = require('superagent');

const { fetch } = require('../npmProfileAggregator.node');

const downloadKeys = ['lastDay', 'lastWeek', 'lastMonth'];
const schemaKeys = ['author', 'modules'];

describe('npm-user-data', function() {
  this.timeout(10000);

  describe('happy path', () => {
    let result;

    before((done) => {
      fetch('cmswalker', (err, res) => {
        assert.ok(!err);
        assert.ok(res);

        result = res;
        done();
      });
    });

    it('should have correct schema', () => {
      schemaTest(result);
    });

    it('should contain author details', () => {
      const { author } = result;
      authorTest(author);
    });

    it('should contain module details', () => {
      const { modules } = result;
      moduleTest(modules);
    });
  });

  describe('error path', () => {
    const sandbox = sinon.sandbox.create();
    let result;

    before((done) => {
      class reqStub {
        timeout() {
          return this;
        }

        set() {
          return this;
        }

        end(callback) {
          return callback(new Error('nope'))
        }
      }

      sandbox.stub(request, 'get').returns(new reqStub());

      fetch('cmswalker', (err, res) => {
        assert.ok(!err);
        assert.ok(res);

        result = res;
        done();
      });
    });

    after(() => sandbox.restore());

    it('should be resilient to API flops', () => {
      const { author, modules } = result;
      schemaTest(result);
      authorTest(author);
      moduleTest(modules);
    });
  });
});

function schemaTest(result) {
  Object.keys(result).forEach((key) => {
    assert.ok(schemaKeys.find(k => k === key), `${key} is not present within schema`);
  });
}

function authorTest(author) {
  const required = ['username', 'link', 'downloads'];

  assert.ok(author);
  required.forEach((key) => {
    assert.ok(author.hasOwnProperty(key), `${key} is a required property of Author`);
  });

  downloadKeys.forEach((key) => {
    assert.ok(author.downloads.hasOwnProperty(key), `Author.downloads must have property ${key}`);
  });
}

function moduleTest(modules) {
  const required = ['name', 'version', 'description', 'downloads', 'contributors', 'maintainers'];

  modules.forEach((module) => {
    required.forEach((key) => {
      assert.ok(module[key], `${key} is a required property of Module: ${JSON.stringify(module, null, 2)}`);
    });
  });

  modules.forEach((module) => {
    downloadKeys.forEach((key) => {
      assert.ok(module.downloads.hasOwnProperty(key), `Module.downloads must have property ${key}`);
      assert.ok(typeof module.downloads[key] === 'number');
    });
  });
}
