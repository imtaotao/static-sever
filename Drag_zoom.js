// touch
function TouchDrag (el, option) {
    if (!el) return
    this.el           = el
    this.parent       = option.parent
    this.equalscale   = option.equalScale
    this.zoomNum      = option.zoom || 1
    this.imgMax       = option.imgMax
    this.imgMin       = option.imgMin
    this.preventSelf  = option.preventSelf
    this.option       = option || {}
    this.go           = function () {}

    this.start        = []
    this.end          = []

    // 移动
    this.preMove      = []
    this.moveDistance = []

    // 差值
    this.allDistance  = []

    // 需要移动的值(每次重新点击不需要更新)
    this.moveVal      = {
        x: 0,
        y: 0
    }

    // 缩放移动的值(每次重新点击不需要更新)
    this.width        = this.getHW(el, 'width')
    this.height       = this.getHW(el, 'height')
    this.zoomVal      = {
        x: this.getHW(el, 'width'),
        y: this.getHW(el, 'height')
    }
    this.preZoom      = {}

    // 移动的限制
    this.limitX       = option.limitX || []
    this.limitY       = option.limitY || []
}

TouchDrag.prototype = {
    constructor: TouchDrag,

    init: function (callback) {
        this.preventDefault()
        this.limit()
        this.touchstart()
        this.move()
        this.touchend(callback)
        return this
    },


    emptied: function () {
        this.start        = []
        this.end          = []
        this.preMove      = []
        this.allDistance  = []
        this.moveDistance = []
        this.preZoom      = {}
        this.move         = this.option.move || true
    },

    preventDefault: function () {
        document.addEventListener('touchmove', function (e) {e.preventDefault()}, {passive: false})
    },

    touchstart: function () {
        var self = this
        this.on('touchstart', function (e) {
            if (e.targetTouches.length > 1) {self.move = false}
            self.go()
            self.emptied()
            var touchList = e.targetTouches
            touchList.__proto__.forEach = [].forEach
            touchList.forEach(function (touch, i) {
                this.start.push({
                    x   : touch.pageX,
                    y   : touch.pageY,
                    time: Date.now()
                })
            }, self)
            self.preMove = self.start

            // 放大缩小的初始化两点之间的值
            if (touchList > 1) {
                var finger = e.targetTouches
                this.preZoom.disX = touchList[0].pageX - touchList[1].pageX
                this.preZoom.disY = touchList[0].pageY - touchList[1].pageY
            }
        }, true)
    },

    touchend: function(callback) {
        var self = this
        this.on('touchend', function (e) {
            var touchList = e.targetTouches
            touchList.forEach(function (touch, i) {
                this.end.push({
                    x   : touch.pageX,
                    y   : touch.pageY,
                    time: Date.now()
                })
            }, self)

            self.createDistance(callback)
            callback && callback.call(self.el, self.allDistance)
        }, true)

    },

    createDistance: function (callback) {
        var start = this.start
        this.end.forEach(function (end, i ) {
            var x = end.x - start[i].x
            var y = end.y - start[i].y
            var distance = Math.sqrt(x * x + y * y)
            this.allDistance.push({
                x       : x,
                y       : y,
                distance: distance,
                time    : end.time - start[i].time
            })
        }, this)
    },

    move: function () {
        var self = this
        this.on('touchmove', function (e) {
            e.preventDefault()
            if (e.targetTouches.length > 1) {self.move = false}
            var touchList     = e.targetTouches
            var preMove       = self.preMove
            var nowCoor       = []
            self.preMove      = []
            self.moveDistance = []

            touchList.forEach(function (touch, i) {
                var x     = touch.pageX
                var y     = touch.pageY
                var time  = Date.now()
                this.moveDistance.push({
                    x   : x - preMove[i].x,
                    y   : y - preMove[i].y,
                    time: time - preMove[i].time
                })

                this.preMove.push({
                    x   : x,
                    y   : y,
                    time: time
                })

                nowCoor.push({x: x, y: y})
            }, self)

            if (self.move && self.moveDistance.length === 1) {
                self.animate()
            }

            if (!self.move || self.moveDistance.length > 1) {
                self.zoom(nowCoor)
            }
        })
    },

    animate: function (distance) {
        var distance    = this.moveDistance[0]
        var el          = this.el
        this.moveVal.x += distance.x
        this.moveVal.y += distance.y
        var x = this.moveVal.x
        var y = this.moveVal.y
        this.moveVal.x = x < this.limitX[1] ? this.limitX[1]
                       : x > this.limitX[0] ? this.limitX[0]
                       : x
        this.moveVal.y = y < this.limitY[1] ? this.limitY[1]
                       : y > this.limitY[0] ? this.limitY[0]
                       : y

        el.style.transform = 'translate3d('+ this.moveVal.x +'px,'+ this.moveVal.y +'px, 0)'

    },

    zoom: function (nowCoor) {
        var el         = this.el,
            equalscale = this.equalscale
            width      = this.width,
            height     = this.height,
            imgMax     = this.imgMax,
            imgMin     = this.imgMin

        if (nowCoor.length > 1) {
            // 计算两点之间的距离
            var disX       = Math.abs(nowCoor[0].x - nowCoor[1].x)
            var disY       = Math.abs(nowCoor[0].y - nowCoor[1].y)
            var changeDisX = disX - this.preZoom.disX || 0
            var changeDisY = disY - this.preZoom.disY || 0
            this.zoomVal.x += changeDisX * this.zoomNum
            this.zoomVal.y += changeDisY * this.zoomNum

            // 缩放的限制
            if (imgMax) {
                this.zoomVal.x > imgMax[0] && (this.zoomVal.x = imgMax[0])
                this.zoomVal.y > imgMax[1] && (this.zoomVal.y = imgMax[1])
            }
            if (imgMin) {
                this.zoomVal.x < imgMin[0] && (this.zoomVal.x = imgMin[0])
                this.zoomVal.y < imgMin[1] && (this.zoomVal.y = imgMin[1])
            }

            // 判断是否等比缩放
            if (equalscale) {
                var move = this.zoomVal.x > this.zoomVal.y ? 'x' : 'y'
                var zoomdisX, zoomdisY

                if (move === 'x') {
                    zoomdisX = this.zoomVal.x
                    zoomdisY = this.zoomVal.x * height / width
                }

                if (move === 'y') {
                    zoomdisX = this.zoomVal.y * width / height
                    zoomdisY = this.zoomVal.y
                }
                el.style.width = zoomdisX + 'px'
                el.style.height = zoomdisY + 'px'

            } else {
                el.style.width = this.zoomVal.x + 'px'
                el.style.height = this.zoomVal.y + 'px'
            }

            // 保存当前的两点之间距离
            this.preZoom.disX = disX
            this.preZoom.disY = disY
        }
    },

    on: function (type, callback, passive) {
        var el = this.el
        document.body.addEventListener(type, function (e) {
            if (this.preventSelf && e.target === el) return
            callback(e)
        }, { passive: !!passive })
    },

    limit: function () {
        var el      = this.el
        var parent  = this.parent || el.parentElement
        var elH     = this.getHW(el, 'height')
        var elW     = this.getHW(el, 'width')
        var parentH = this.getHW(parent, 'height')
        var parentW = this.getHW(parent, 'width')
        var limitX  = this.limitX
        var limitY  = this.limitY

        if (limitX.length === 0) {
            var smallX  = 0
            var bigX    = parentW - elW
            this.limitX = [bigX, smallX]
        }

        if (limitY.length === 0) {
            var smallY  = 0
            var bigY    = parentH - elH
            this.limitY = [bigY, smallY]
        }
    },

    reset: function (option) {
        if (!option) return
        option.move       && (this.option.move = option.move)
        option.parent     && (this.parent      = option.parent)
        option.equalscale && (this.equalscale  = option.equalscale)
        option.zoomNum    && (this.zoomNum     = option.zoom)
        option.imgMax     && (this.imgMax      = option.imgMax)
        option.imgMin     && (this.imgMin      = option.imgMin)
        option.limitX     && (this.limitX      = option.limitX)
        option.limitY     && (this.limitY      = option.limitY)
        option.el         && (this.el          = el)
        this.limit()
    },

    getHW: function (dom, attr) {
        return parseInt(getComputedStyle(dom)[attr])
    }
}