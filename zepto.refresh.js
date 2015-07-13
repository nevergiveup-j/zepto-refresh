/**
 * @Description: 下拉到底部和上拉到顶部再拉就出现刷新效果
 * @Author: wangjun
 * @Update: 2015-07-13 18:00
 * @version: 1.0
 * @Github URL: https://github.com/nevergiveup-j/Zepto.refresh
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
        isRefresh: true,
        // 触摸移动的方向
        movePosition   : null,
        // 下拉阈值
        minDistanceToRefresh: 50,
        // 下拉最大阈值
        maxDistanceToRefresh: 200,
        // 更新限制时间, 默认不限制
        interval : 5,
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
        this.isPullToRefresh = false;
        this.isLoading = false;
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
    };

    /**
     * loading加载
     */
    Refresh.prototype.loadingRender = function(){
        var that = this;

        var refreshTpl = [
            '<style>',
            '.preloader-refresh {display:none;position: absolute;top: 0;left: 0;width: 100%;text-align: center;padding: 10px 0;z-index: 800}',
            '.preloader-refresh .preloader-refresh-content {width: 40px;height: 40px;margin: 0 auto;overflow: hidden;background-color: #fafafa;border-radius: 40px;box-shadow: 0 4px 10px #bbb}',
            '</style>',
            '<div class="preloader-refresh">',
                '<div class="preloader-refresh-content">',
                    '<svg id="loader-tip-svg" x="0px" y="0px"',
                        'width="40px" height="40px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve">',
                        '<path fill="#dd0202" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z">',
                            '<animateTransform attributeType="xml"',
                                'attributeName="transform"',
                                'type="rotate"',
                                'from="0 25 25"',
                                'to="360 25 25"',
                                'dur="0.6s"',
                                'repeatCount="indefinite"/>',
                        '</path>',
                    '</svg>',
                '</div>',
            '</div>'
        ].join('');


        var moveTpl = [
            '<style>',
            '.preloader-loading-more {padding: 15px 10px;text-align:center;}',
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
        if ( that.opts.isRefresh ) {
            that.$content.before( refreshTpl );
            that.$pullToRefresh = $('.preloader-refresh');
        }

        // 加载更多模板
        that.$content.after( moveTpl );
        that.$loadingMore = $('.preloader-loading-more');

    };
    
    /**
     * 事件开始
     */
    Refresh.prototype.bind = function() {
        var that = this,
            timer = null;

        that.$wrap
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
            }).
            on('scroll', function() {
                timer = setTimeout(function() {
                    that.getLoadMore( that.$wrap );
                }, 300);
            });


    };

    /**
     * 触摸移动Move
     */
    Refresh.prototype.touchMove = function(e, elem) {
        var target = $(e.target);
        //如果不是在拖动content, 则不触发.
        if (!target.parents(this.opts.contentEl).size() || !this.opts.isRefresh) {
            return;
        }

        var currentX = e.touches[0].pageX,
            currentY = e.touches[0].pageY;

        // 如果横向滚动大于纵向滚动. 取消触发事件
        if (Math.abs(currentX - this.startX) > Math.abs(currentY - this.startY)) {
            this.isPullToRefresh = false;
            this.$content[0].style[Util.prefixStyle('transform')] = 'translate(0, 0)';
            return;
        }

        // 设置移动方向
        if (currentY - this.startY > 0) {
            this.opts.movePosition = 'down';
        }
        else {
            this.opts.movePosition = 'up';
        }

        // distance在区间内按正弦分布
        var distance = currentY - this.startY;
            distance = distance < this.opts.maxDistanceToRefresh ? distance : this.opts.maxDistanceToRefresh;
            distance = Math.sin(distance/this.opts.maxDistanceToRefresh) * distance;

        // 当前处于首屏，50像素容差值 && 向下滑动刷新
        if ( this.scrollTop < this.opts.minDistanceToRefresh && this.opts.movePosition === 'down'  ) {
            this.$pullToRefresh.show();
            this.$content[0].style[Util.prefixStyle('transform')] = 'translate(0,' + distance + 'px)' + Util.translateZ();
            e.preventDefault();
            this.isPullToRefresh = true;
            return;
        }

        this.$pullToRefresh.hide();
        this.isPullToRefresh = false;
        
    };

    /**
     * 触摸结束
     */
    Refresh.prototype.touchEnd = function(e) {
        var that = this;

        if (!this.isPullToRefresh) {
            return;
        }

        /**
         * 回调执行完，回调
         */   
        function complete() {
            this.$pullToRefresh.hide();
            this.wrapHeight = this.$content.height();
        }

        // 500ms回弹
        setTimeout(function() {
            that.$content[0].style[Util.prefixStyle('transform')] = '';
            that.$content[0].style[Util.prefixStyle('transition')] = '';
        }, 500);

        // 更新refresh 状态
        this.isPullToRefresh = false;

        // 如果存在最大时间限制, 切刷新时间未超出该时间，则不刷新
        var now = new Date().getTime();

        if(this.opts.interval && now - this.loadingFinishTime < this.opts.interval){
            complete();
            return;
        }

        this.loadingFinishTime = now;

        // 添加动画事件
        this.$content[0].style[Util.prefixStyle('transition')] = 'all .3s';
        this.$content[0].style[Util.prefixStyle('transform')] = 'translate(0,0)' + Util.translateZ();

        this.$pullToRefresh.show();
        // 回调
        this.opts.refreshCallback && this.opts.refreshCallback(complete);

    };

    /**
     * 加载更多
     */
    Refresh.prototype.getLoadMore = function(elem) {
        var that = this,
            scrollTop = elem.scrollTop(),
            viewTop = viewHeight + scrollTop,
            moreTime = null;

        /**
         * 回调执行完，回调
         */   
        function complete(status) {
            that.isLoading = false;
            that.$loadingMore.hide();

            if("finish" == status){
                that.$wrap.off("scroll", that.scrollEvent);
            }

            that.wrapHeight = that.$content.height();
        }

        if ( this.wrapHeight <= viewTop + 10  && this.oldScrollTop < scrollTop && !this.isLoading ) {
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
