# my-npm-profile :hatched_chick:
NPM Profile Aggregator

Node and Browser Compatible, use it anywhere

```
npm install my-npm-profile --save
```

### One API method to aggregate your NPM stats
Everything is pre-bundled into one function

Usage

```javascript
const myNpmProfile = require('my-npm-profile');

const npmUserName = 'tom123';

myNpmProfile(npmUserName, (err, response) => {
  // ...that's it!
});
```

### Response Payload
```javascript
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
