const fs = require('fs')
const url = require('url')
const path = require('path')
const mime = require('mime').types
const {
  error,
  isUndef,
  createHtmlDocument,
} = require('util')

const BYTES_RANGE_REGEXP = /^ *bytes=/
const MAX_MAXAGE = 60 * 60 * 24 * 365 * 1000 // 1 year
const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/

function staticFun (publicUrl, root, options, reject) {
  return function (req, res) {
    if (isUndef(root)) {
      root = publicUrl
      publicUrl = ''
    }

    // 静态资源值允许 get head
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405
      res.setHeader('Allow', 'GET, HEAD')
      res.setHeader('Content-Length', '0')
      res.end()
      return
    }

    const opts = Object.create(options || null)

    const { isIndex, fileUrl, mimeType, pathname } = getFileInfor(req.url)


    if (!mimeType) {
      error(500)
      return
    }

    if (filterStaticFile(res, pathname)) return

    // send
  }
}

function send (res, url) {
  const readStream = fs.createReadStream(url)
  if (!readStream) {
    return null
  }

  readStream.on('data', chunk => {
    if(!res.write(chunk, 'blob')) {
      readStream.pause()
    }
  })
  readStream.on('end', _ => {
    res.end()
    this.staticInterface[url] = true
  })
  res.on('drain', _ => readStream.resume())
}

function sendFile () {

}

function sendIndex () {

}

function clearHeaders (res) {
  const headers = getHeaderNames(res)

  for (let header of headers) {
    res.removeHeader(header)
  }
}

function sendHearders (res, headers) {
  const keys = Object.keys(headers)

  for (let key of keys) {
    res.setHeader(key, headers[key])
  }
}

function getFileInfor (reqUrl) {
  let { pathname } = url.parse(reqUrl, true)
  if (pathname === '/' && pathname.substr(-1) !== '/') {
    pathname = ''
  }

  const extname = path.extname(pathname)

  const mimeType = mime[
    extname.slice(1, extname.length)
  ]

  const isIndex = pathname === ''
    ? true
    : false

  const fileUrl = path.posix.join(publicUrl, staticRoot, pathname)

  return {
    isIndex,
    fileUrl,
    mimeType,
    pathname,
  }
}

function filterStaticFile (res, fileName) {
  const fileNameList = '/sw.js,/favicon.ico,'
  if (fileName === '/sw.js') {
    res.writeHead(200, {
      'Content-Type': `${mimeObj['.js']};charset=UTF-8`
    })
  }
  res.end()
  return fileNameList.includes(fileName)
}

function createETagGenerator (options) {
  return function generateETag (body, encoding) {
    var buf = !Buffer.isBuffer(body)
      ? Buffer.from(body, encoding)
      : body

    return etag(buf, options)
  }
}

exports.static = function (publicUrl, root, options) {
  return new Promise((resolve, reject) => {
    resolve((...args) => {
      staticFun(publicUrl, root, options, reject)(...args)
    })
  })
}
