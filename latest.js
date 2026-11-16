#!/usr/bin/env node
const { buildLists } = require('./lists')

buildLists()
  .then(({ versions, lists }) => {
    console.log(`SPDX License List Version: ${versions.spdxLicenses}`)
    console.log(`SPDX Exception List Version: ${versions.spdxExceptions}`)

    let outdated = false
    Object.entries(lists).forEach(([file, latest]) => {
      const current = require(`./${file}.json`)
      const missing = latest.filter(id => !current.includes(id))
      const extra = current.filter(id => !latest.includes(id))
      if (missing.length || extra.length) {
        outdated = true
        console.error(`${file}.json is out of date.`)
        missing.forEach(id => console.error(`  Missing: ${id}`))
        extra.forEach(id => console.error(`  Extra: ${id}`))
      } else if (JSON.stringify(current) !== JSON.stringify(latest)) {
        outdated = true
        console.error(`${file}.json is out of order.`)
      } else {
        console.log(`${file}.json is up to date.`)
      }
    })

    if (outdated) {
      console.error('Run `npm run build` to update.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error(error.message)
    process.exit(1)
  })