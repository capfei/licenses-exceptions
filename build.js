#!/usr/bin/env node
const fs = require('fs')
const { buildLists } = require('./lists')

buildLists()
  .then(({ lists }) => {
    Object.entries(lists).forEach(([file, list]) => {
      fs.writeFileSync(file + '.json', JSON.stringify(list, null, 2) + '\n')
      console.log(`Wrote ${file}.json (${list.length} entries)`)
    })
  })
  .catch(error => {
    console.error(error.message)
    process.exit(1)
  })