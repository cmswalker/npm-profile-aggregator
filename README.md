# npm-profile-aggregator :hatched_chick:

NPM Profile Aggregator

Node and Browser Compatible, use it anywhere.

Want to test it out?

Checkout the [Demo](https://cmswalker.github.io/npm-profile-aggregator/) which searches via text input or url params `?profile=username`

or drop it into the window using this [script](https://raw.githubusercontent.com/cmswalker/npm-profile-aggregator/master/npmProfileAggregator.min.js)

```shell
npm install npm-profile-aggregator --save
```

## One API method to aggregate NPM stats

Everything is pre-bundled into one function

### Usage

```js
const { fetch } = require('npm-profile-aggregator');

const npmUserName = 'tom123';

fetch(npmUserName, (err, response) => {
  // ...that's it!
});
```

### Response Payload

```js
// Response Schema is broken down into 2 main sections, author and modules
{
  author: {
    // NOTE: Total Aggregate Module Downloads
    downloads: {
        lastDay: Number,
        lastWeek: Number,
        lastMonth: Number
    },
    link: String,
    username: String
  },
  modules: [
    {
      name: String,
      description: String,
      version: String,
      downloads: {
          lastDay: Number,
          lastWeek: Number,
          lastMonth: Number
      },

      // NOTE: + Everything else available in package.json
      engines: Object,
      repository: Object,
      maintainers: Array,
      contributors: Array,
      scripts: Object,
      keywords: Array,
      ...etc
    },
    {...}
  ]
}
```

The main function aggregates various NPM endpoints in parallel.

It's also failsafe, so if an API call fails, you'll always get something back in accordance to the Response Payload Schema
