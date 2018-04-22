const fs = require('fs')
const path = require('path')
const mime = require('mime')
const Stream = require('stream')
const {
  error,
  isUndef,
} = require('./util')

// 需要用的一些常量
const MAX_MAXAGE = 60 * 60 * 24 * 360 * 1000 // 限制为 1 年
const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/

function getValue (val, replaceValue = true) {
  return isUndef(val)
    ? replaceValue
    : typeof val === 'string'
      ? val
      : Boolean(val)
}

// 解析 http token 列表
function parseTokenList (str) {
  var end = 0
  var list = []
  var start = 0

  // 收集 token
  for (var i = 0, len = str.length; i < len; i++) {
    switch (str.charCodeAt(i)) {
      case 0x20: /*   */
        if (start === end) {
          start = end = i + 1
        }
        break
      case 0x2c: /* , */
        list.push(str.substring(start, end))
        start = end = i + 1
        break
      default:
        end = i + 1
        break
    }
  }

  // 最终的 token
  list.push(str.substring(start, end))

  return list
}

// 将 HTTP 日期解析为数字
function parseHttpDate (date) {
  var timestamp = date && Date.parse(date)

  return typeof timestamp === 'number'
    ? timestamp
    : NaN
}

class SendStream extends Stream {
  constructor (req, res, path, opts = {}) {
    this.req = req
    this.res = res
    this.opts = opts
    this.path = path

    this._acceptRanges = getValue(opts.acceptRanges)

    this._cacheControl = getValue(opts.cacheControl)

    this._etag = getValue(opts.etag)

    this._dotfiles = getValue(opts.dotfiles, 'ignore')

    this._immutable = getValue(opts.immutable)

    this._hidden = Boolean(opts.hidden)

    this._lastModified = getValue(opts.lastModified)

    this._root = opts.root
      ? path.resolve(opts.root)
      : null

    this._index = ['index.html']

    this._maxage = Number(opts.maxage)
    this._maxage = !Number.isNaN(this._maxage)
      ? Math.min(Math.max(0, this._maxage), MAX_MAXAGE)
      : 0
  }

  etag (val) {
    this._etag = Boolean(val)
    return this
  }

  hidden (val) {
    this._hidden = Boolean(val)
    this._dotfiles = undefined
    return this
  }

  index (path = []) {
    this._index = [].concat(path)
    return this
  }

  root (path) {
    this._root = path.resolve(String(path))
    return this
  }

  maxage (maxAge) {
    maxAge = Number(maxAge)
    this._maxage = !Number.isNaN(maxAge)
      ? Math.min(Math.max(0, maxAge), MAX_MAXAGE)
      : 0
  }

  error (status, error) {
    error(this.res, status, error)
    return this
  }

  // 检查 pathname 结尾是否是 '/'
  hasTrailingSlash () {
    return this.path[this.path.length - 1] === '/'
  }

  // 检查这是否是一个有条件的GET请求
  isConditionalGET () {
    return this.req.headers['if-match'] ||
      this.req.headers['if-unmodified-since'] ||
      this.req.headers['if-none-match'] ||
      this.req.headers['if-modified-since']
  }

  // 检查请求前提条件是否失败
  isPreconditionFailure () {
    const { req, res } = this

    // if-match
    const match = req.headers['if-match']
    if (match) {
      // https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/If-Match
      const etag = res.getHeader('ETag')
      return !etag || (match !== '*' && parseTokenList(match).every(match => {
        return match !== etag && match !== 'W/' + etag && 'W/' + match !== etag
      }))
    }

    // if-unmodified-since
    // https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/If-Unmodified-Since
    const unmodifiedSince = parseHttpDate(req.headers['if-unmodified-since'])
    if (!Number.isNaN(unmodifiedSince)) {
      const lastModified = parseHttpDate(res.getHeader('Last-Modified'))
      return Number.isNaN(lastModified) || lastModified > unmodifiedSince
    }

    return false
  }
}

module.exports = function send (...args) {
  return new SendStream(...args)
}