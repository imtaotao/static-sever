const fs = require('fs')
const url = require('url')
const querystring = require('querystring')
const {
	send,
	log
} = require('./utils')

class Tool {
	constructor () {
		this.staticInterface = {}
	}

	resolveUrl (req, res, type, requestMethod) {
		return new Promise ((reject, resolve) => {
			const { pathname, query } = url.parse(req.url, true)

			function get () {
				resolve({ query, pathname })
			}

			function post () {
				const information = {
					pathname,
					query: '',
				}

				req.on('data', chunk => information.query += chunk)
				req.on('end', _ => {
					information.query = querystring.parse(information.query)
					resolve(information)
				})
			}

			type === 'get' && get()
			type === 'post'&& post()

			// use 中间键根据不同各类返回不同的数据
			if (type === 'use') {
				requestMethod === 'get'
					? get()
					: post()
			}

			process.nextTick(_ => {
				if(!this.inter[pathname]) {
					(this.notFontHook || reject)({req, res})
				}
			})
		})
	}

	setMiddleware (interfaceUrl, type) {
		return new Promise((resolve, reject) => {
			this.middleware.push((req, res) => {
				const requestMethod = req.method.toLocaleLowerCase()
				// 如果客户端请求不匹配就 return
				if (
					  type !== 'use' &&
					  type !== requestMethod
				) return

				this.inter[interfaceUrl] = true
				this.resolveUrl(req, res, type, requestMethod)
				.then((information) => {
					resolve({req, res, information})
				})
				.catch(error => reject(error))
			})
		})
	}

	returnCache (req, res, url, mimeType) {
		if (this.staticInterface[url] && isCatch()) {
			res.writeHead(304, {'Content-Type': `${mimeType};charset=UTF-8`});
		}

		function isCatch () {
			const cacheControl = req.headers['cache-control'] === 'no-cache'
				? false
				: true
		}
		
		log(req.headers)
		return false
	}
}

module.exports = {
  Tool,
}