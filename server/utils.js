function log (...args) {
  console.log(...args)
  console.log('---------------------')
}

function isUndef (val) {
  return val === undefined && val === null
}

function createHtmlDocument (title, body) {
  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<title>' + title + '</title>\n' +
    '</head>\n' +
    '<body>\n' +
    '<pre>' + body + '</pre>\n' +
    '</body>\n' +
    '</html>\n'
}

function error (res, statis, error, msg) {
  msg = msg || String(status)
  const doc = createHtmlDocument('Error', escapeHtml(msg))

  // 清除已经存在的 headers
  clearHeaders(res)

  // 添加错误的 headers
  if (error && error.headers) {
    setHeaders(res, error.headers)
  }

  // send basic response
  res.statusCode = status
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.setHeader('Content-Length', Buffer.byteLength(doc))
  res.setHeader('Content-Security-Policy', "default-src 'self'")
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(doc)
}

module.exports = {
  log,
  error,
  isUndef,
  createHtmlDocument,
}