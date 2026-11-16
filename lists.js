const https = require('https')
const order = require('./order')

const SOURCES = {
  spdxExceptions: 'https://spdx.org/licenses/exceptions.json',
  spdxLicenses: 'https://spdx.org/licenses/licenses.json',
  scancode: 'https://scancode-licensedb.aboutcode.org/index.json'
}

function fetchJSON (url) {
  return new Promise((resolve, reject) => {
    https.get(url, response => {
      if (response.statusCode !== 200) {
        response.resume()
        reject(new Error(`${url} responded ${response.statusCode}`))
        return
      }
      const chunks = []
      response
        .on('data', chunk => { chunks.push(chunk) })
        .once('error', reject)
        .once('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks)))
          } catch (error) {
            reject(error)
          }
        })
    }).once('error', reject)
  })
}

function finalize (list) {
  return Array.from(new Set(list)).sort(order)
}

// Fetches SPDX and ScanCode data and returns the combined, sorted lists.
async function buildLists () {
  const [spdxExceptions, spdxLicenses, scancode] = await Promise.all([
    fetchJSON(SOURCES.spdxExceptions),
    fetchJSON(SOURCES.spdxLicenses),
    fetchJSON(SOURCES.scancode)
  ])

  const licenses = []
  const deprecatedLicenses = []
  const exceptions = []
  const deprecatedExceptions = []

  spdxExceptions.exceptions.forEach(object => {
    const id = object.licenseExceptionId
    if (object.isDeprecatedLicenseId) {
      deprecatedExceptions.push(id)
    } else {
      exceptions.push(id)
    }
  })

  spdxLicenses.licenses.forEach(object => {
    const id = object.licenseId
    if (object.isDeprecatedLicenseId) {
      deprecatedLicenses.push(id)
    } else {
      licenses.push(id)
    }
  })

  // Deprecated ScanCode entries often lack an SPDX key, so use the ScanCode key.
  scancode.forEach(object => {
    if (object.is_exception) {
      if (object.is_deprecated) {
        deprecatedExceptions.push(object.license_key)
      } else {
        exceptions.push(object.spdx_license_key)
      }
    } else if (object.is_deprecated) {
      deprecatedLicenses.push(object.license_key)
    } else {
      licenses.push(object.spdx_license_key)
    }
  })

  return {
    versions: {
      spdxLicenses: spdxLicenses.licenseListVersion,
      spdxExceptions: spdxExceptions.licenseListVersion
    },
    lists: {
      'licenses-index': finalize(licenses),
      'licenses-deprecated': finalize(deprecatedLicenses),
      'exceptions-index': finalize(exceptions),
      'exceptions-deprecated': finalize(deprecatedExceptions)
    }
  }
}

module.exports = { buildLists, SOURCES }
