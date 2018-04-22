const url = require('url')
const path = require('path')
const http = require('http')
const mime = require('mime')
const { Tool } = require('./tool')
const { static } = require('./server-static')

// server 实现
class Server extends Tool {
	constructor () {
		super()
		this.inter = {}
		this.middleware = []
		this.notFont = _ => {}
		this.staticFun = _ => {}
	}

	listener (port, callback = _ => {}) {
		const app = this.app = http.createServer((req, res) => {
			this.flowArray = { req, res }
			// 静态文件
			this.staticFun(req, res)
			// 中间件
			for (const fun of this.middleware) {
				fun(req, res)
			}
		})

		app.listen(port, 1, callback)
		return app
	}

  get (interfaceUrl) {
		return this.use(interfaceUrl, 'get')
	}

	post (interfaceUrl) {
		return this.use(interfaceUrl, 'post')
	}

	use (interfaceUrl, type = 'use') {
		return new Promise((resolve, reject) => {
			this.setMiddleware(interfaceUrl, type)
			.then(res => resolve(res))
			.catch(error => reject(error))
		})
	}

	static (publicUrl, root, options) {
		static(publicUrl, root, options)
			.then(fun => this.staticFun = fun)
			.catch(error => reject(error))
	}
}

module.exports = Server