/**
 * @Description: 下拉到底部和上拉到顶部再拉就出现刷新效果
 * @Author: wangjun
 * @Update: 2015-12-21 18:00
 * @version: 1.2
 * @Github URL: https://github.com/nevergiveup-j/zepto-refresh
 */
 
;(function (factory) {
    if (typeof define === "function" && define.amd) {
        // AMD模式
        define([ "Zepto" ], factory);
    } else {
        // 全局模式
        factory(Zepto);
    }
}(function ($) {
    "use strict";

    /**
     * 工具库
     * @type {Object}
     */
    var Util = {
        elementStyle: document.createElement('div').style,
        // 判断浏览器内核类型
        vendor: function() {
            var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
                transform,
                i = 0,
                l = vendors.length;

            for ( ; i < l; i++ ) {
                transform = vendors[i] + 'ransform';
                if ( transform in Util.elementStyle ) {
                    return vendors[i].substr(0, vendors[i].length-1);
                }
            }

            return false;
        },
        // 判断浏览器来适配css属性值
        prefixStyle: function(style) {
            if ( Util.vendor() === false ) return false;
            if ( Util.vendor() === '' ) return style;

            return Util.vendor() + style.charAt(0).toUpperCase() + style.substr(1);
        },
        // 判断是否支持css transform-3d（需要测试下面属性支持）
        hasPerspective: function(){
            var ret = Util.prefixStyle('perspective') in Util.elementStyle;
            if ( ret && 'webkitPerspective' in Util.elementStyle ) {
                Util.injectStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function( node, rule ) {
                    ret = node.offsetLeft === 9 && node.offsetHeight === 3;
                });
            }
            return !!ret;
        },
        translateZ: function(){
            if(Util.hasPerspective){
                return ' translateZ(0)';
            }else{
                return '';
            }
        }
    }

    // 分享默认配置
    var defaults = {
        // 内容ID
        contentEl: '#J_content',
        // 默认开启刷新
        isRefresh              : true,
        // 默认开启加载更多
        isLoadingMore          : true,
        // 触摸移动的方向
        movePosition           : null,
        // 下拉可刷新高度
        distanceToRefresh      : 100,
        // 下拉最小阈值
        minDistanceToRefresh   : 100,
        // 下拉最大阈值
        maxDistanceToRefresh   : 200,
        // 更新限制时间, 默认不限制
        interval               : 5,
        // 刷新回调
        refreshCallback: function() {

        },
        // 加载更多回调
        loadingMoreCallback: function() {

        }  
    };

    var viewHeight = $(window).height();


    function Refresh( $this, options ) {

        this.$wrap = $this;

        this.opts = $.extend(true, {}, defaults, options || {});

        this.$content = $(this.opts.contentEl);

        this.startY = 0;
        this.refreshHeight = 0;
        this.isPullToRefresh = false;
        this.isLoading = false;
        this.finished = false;
        this.wrapHeight = this.$content.height();
        this.oldScrollTop = 0;
        this.loadingFinishTime = new Date().getTime();

        this.scrollTop = this.$content.scrollTop();
        this.init();
    };


    /**
     * 初始化
     */
    Refresh.prototype.init = function(){
        this.loadingRender();

        this.bind();
        this.reBindScroll();
    };

    /**
     * loading加载
     */
    Refresh.prototype.loadingRender = function(){
        var that = this;

        var refreshTpl = [
            '<style>',
            '.preloader-refresh {position: absolute;top: -50px;left: 0;right: 0;width: 100%;text-align: center;padding: 5px 0;}',
            '.preloader-refresh .icon-refresh {display: inline-block;width: 40px;height: 40px; background: url(images/pull-icon@2x.png) no-repeat 0 0;background-size: 40px 80px;-webkit-transition-property:-webkit-transform;-webkit-transition-duration:250ms;-webkit-transform:rotate(0deg) translateZ(0);}',
            '.preloader-refresh-flip .icon-refresh {-webkit-transform:rotate(-180deg) translateZ(0);}',
            '.preloader-refresh-loading .icon-refresh {background-position:0 100%;-webkit-transform:rotate(0deg) translateZ(0);-webkit-transition-duration:0ms;-webkit-animation-name:refreshLoading;-webkit-animation-duration:2s;-webkit-animation-iteration-count:infinite;-webkit-animation-timing-function:linear;}',
            '@-webkit-keyframes refreshLoading {',
                'from { -webkit-transform:rotate(0deg) translateZ(0); }',
                'to { -webkit-transform:rotate(360deg) translateZ(0); }',
            '}',
            '</style>',
            '<div class="preloader-refresh">',
                '<i class="icon-refresh"></i>',
            '</div>'
        ].join('');


        var moveTpl = [
            '<style>',
            '.preloader-loading-more {display: none;padding: 15px 10px;text-align:center;}',
            '.preloader-loading-more:before,.preloader-loading-more:after {content:""}',
            '.preloader-loading-more .loading-bounce, .preloader-loading-more:before, .preloader-loading-more:after {width: 15px;height: 15px;background-color: #dd0202;-webkit-border-radius: 100%;border-radius: 100%;display: inline-block; -webkit-animation: bouncedelay 1.4s infinite ease-in-out;animation: bouncedelay 1.4s infinite ease-in-out; -webkit-animation-fill-mode: both;animation-fill-mode: both;}',
            '.preloader-loading-more:before {-webkit-animation-delay: -0.32s;animation-delay: -0.32s;}',
            '.preloader-loading-more .loading-bounce {-webkit-animation-delay: -0.16s;animation-delay: -0.16s;}',
            '@-webkit-keyframes bouncedelay {',
                '0%, 80%, 100% { -webkit-transform: scale(0.0) }',
                '40% { -webkit-transform: scale(1.0) }',
            '}',
            '@keyframes bouncedelay {',
                '0%, 80%, 100% {',
                    'transform: scale(0.0);',
                '} 40% {',
                    'transform: scale(1.0);',
                '}',
            '}',
            '</style>',
            '<div class="preloader-loading-more">',
                '<span class="loading-bounce"></span>',
            '</div>'
        ].join('');

        // 刷新模板
        if(this.opts.isRefresh) {
            this.$content.before( refreshTpl );
            this.$pullToRefresh = $('.preloader-refresh');
            this.refreshHeight = this.$pullToRefresh.height();
        }

        // 加载更多模板
        if(this.opts.isLoadingMore) {
            this.$content.after( moveTpl );
            this.$loadingMore = $('.preloader-loading-more');
        }
    };

    /**
     * 事件
     */
    Refresh.prototype.bind = function() {
        var that = this;

        // 未开启刷新不添加事件
        if(this.opts.isRefresh) {
            this.$wrap
                .on('touchstart', function(e) {
                    that.startX = e.touches[0].pageX;
                    that.startY = e.touches[0].pageY;
                })
                .on('touchmove', function(e) {
                    that.scrollTop = $(this).scrollTop();

                    that.touchMove(e, $(this));
                })
                .on('touchend', function(e) {
                    that.touchEnd(e);
                });
        }

    };

    /**
     * 事件
     */
    Refresh.prototype.reBindScroll = function() {
        var that = this,
            timer = null;

        this.$wrap
            .off('scroll.refresh')
            .on('scroll.refresh', function() {
                timer = setTimeout(function() {
                    that.getLoadMore();
                }, 300);
            });
    };

    /**
     * 触摸移动Move
     */
    Refresh.prototype.touchMove = function(e, elem) {
        var target = $(e.target);
        //如果不是在拖动content, 则不触发.
        if (!target.parents(this.opts.contentEl).size()) {
            return;
        }

        var currentX = e.touches[0].pageX - this.startX,
            currentY = e.touches[0].pageY - this.startY;

        // 如果横向滚动大于纵向滚动. 取消触发事件
        if (Math.abs(currentX) > Math.abs(currentY)) {
            this.isPullToRefresh = false;
            this.$content[0].style[Util.prefixStyle('transform')] = 'translate(0, 0)' + Util.translateZ();
            this.$pullToRefresh[0].style[Util.prefixStyle('transform')] = 'translate(0, 0)' + Util.translateZ();
            return;
        }

        // 设置移动方向
        if (currentY > 0) {
            this.opts.movePosition = 'down';
        }else {
            this.opts.movePosition = 'up';
        }

        // distance在区间内按正弦分布
        var distance = currentY;
            distance = distance < this.opts.maxDistanceToRefresh ? distance : this.opts.maxDistanceToRefresh;
            distance = Math.sin(distance/this.opts.maxDistanceToRefresh) * distance;


        // 当前处于首屏，distanceToRefresh像素容差值 && 向下滑动刷新
        if ( this.scrollTop <= this.opts.distanceToRefresh && this.opts.movePosition === 'down'  ) {
            
            if(currentY >= this.opts.minDistanceToRefresh){
                this.$pullToRefresh.addClass('preloader-refresh-flip');
                this.isPullToRefresh = true;
            }else{
                this.$pullToRefresh.removeClass('preloader-refresh-flip');
                this.isPullToRefresh = false;
            }
            
            this.$content[0].style[Util.prefixStyle('transform')] = 'translate(0,' + distance + 'px)' + Util.translateZ(); 
            this.$pullToRefresh[0].style[Util.prefixStyle('transform')] = 'translate(0,' + distance + 'px)' + Util.translateZ(); 
            e.preventDefault();
            return;
        }

        // this.$pullToRefresh.hide();
        this.isPullToRefresh = false;
        
    };

    /**
     * 触摸结束
     */
    Refresh.prototype.touchEnd = function(e) {
        var that = this;

        /**
         * 回调执行完，回调
         */   
        function complete() {
            that.$pullToRefresh.removeClass('preloader-refresh-loading');
            that.wrapHeight = that.$content.height();
            that.$content[0].style[Util.prefixStyle('transition')] = 'all .3s';
            that.$content[0].style[Util.prefixStyle('transform')] = 'translate(0, 0)' + Util.translateZ();
            that.$pullToRefresh[0].style[Util.prefixStyle('transition')] = 'all .3s';
            that.$pullToRefresh[0].style[Util.prefixStyle('transform')] = 'translate(0, 0)' + Util.translateZ(); 

            // 下拉加载到最后一页，异步刷新重新开始scroll事件
            if(that.finished){
                that.finished = false;
                that.reBindScroll();
            }

            clearStyle();
        };

        // 清除样式
        function clearStyle() {
            // 500ms回弹
            setTimeout(function() {
                that.$content[0].style[Util.prefixStyle('transition')] = '';
                that.$pullToRefresh[0].style[Util.prefixStyle('transition')] = '';
            }, 500);
        };

        clearStyle();

        // 如果存在最大时间限制, 切刷新时间未超出该时间，则不刷新
        var now = new Date().getTime();

        if(this.opts.interval && now - this.loadingFinishTime < this.opts.interval){
            complete();
            return;
        }

        this.loadingFinishTime = now;

        var distance = 0;

        // 向下滑动距离最小阈值
        if (this.isPullToRefresh) {
            distance = this.refreshHeight;
        }

        // 添加动画事件
        this.$content[0].style[Util.prefixStyle('transition')] = 'all .3s';
        this.$content[0].style[Util.prefixStyle('transform')] = 'translate(0, ' + distance + 'px)' + Util.translateZ();
        this.$pullToRefresh[0].style[Util.prefixStyle('transition')] = 'all .3s';
        this.$pullToRefresh[0].style[Util.prefixStyle('transform')] = 'translate(0,' + distance + 'px)' + Util.translateZ(); 

        // 回调
        if (this.isPullToRefresh) {
            this.$pullToRefresh
                .removeClass('preloader-refresh-flip')
                .addClass('preloader-refresh-loading');
            this.opts.refreshCallback && this.opts.refreshCallback(complete);
            // 更新refresh 状态
            this.isPullToRefresh = false;
        }

    };

    /**
     * 加载更多
     */
    Refresh.prototype.getLoadMore = function() {
        var that = this;

        if(this.finished){
            return;
        }

        var scrollTop = this.$wrap.scrollTop(),
            viewTop = viewHeight + scrollTop,
            moreTime = null;

        /**
         * 回调执行完，回调
         */   
        function complete(status) {
            if("finish" == status){
                that.finished = true;
                that.$wrap.off("scroll.refresh");
            }

            that.isLoading = false;
            that.$loadingMore.hide();
            that.wrapHeight = that.$content.height();
        }

        if ( this.wrapHeight <= viewTop + 10  && this.oldScrollTop < scrollTop && !this.isLoading && this.opts.isLoadingMore ) {
            // 如果存在最大时间限制, 切刷新时间未超出该时间，则不刷新
            var now = new Date().getTime();
            if(this.opts.interval && now - this.loadingFinishTime < this.opts.interval){
                return;
            }
            this.loadingFinishTime = now;

            this.$loadingMore.show();
            // loading状态更新
            this.isLoading = true;

            this.opts.loadingMoreCallback && this.opts.loadingMoreCallback(complete);
        }

        this.oldScrollTop = scrollTop;

    };

    $.fn.refresh = function( options, callback ) {
        return this.each(function() {
            new Refresh( $(this), options );
        })
    };
    
    // ADM 
    return Refresh;
}));
