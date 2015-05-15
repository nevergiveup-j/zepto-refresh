/**
 * @Description: 下拉到底部和上拉到顶部再拉就出现刷新效果
 * @Author: wangjun
 * @Update: 2015-05-14 16:00
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
        contentEl: '',
        // 默认开启刷新
        isRefresh: true,
        // 下拉可刷新高度
        distanceToRefresh: 50,
        // 触摸移动的方向
        movePosition   : null,
        // 刷新回调
        refreshCallback: function() {

        },
        // 加载更多回调
        loadingMoreCallback: function() {

        }  
    };

    var viewHeight = $(window).height();


    function Refresh( $this, options, callback ) {

        this.$wrap = $this;
        this.$content = $('#J_scrller');

        this.opts = $.extend(true, {}, defaults, options || {});

        this.startY = 0;
        this.isPullToRefresh = false;
        this.isLoading = false;
        this.wrapHeight = this.$content.height();
        this.oldScrollTop = 0;

        this.scrollTop = $(window).scrollTop();
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
            '.preloader-refresh {display: none; width: 100%;text-align: center;height: 40px;line-height:40px;background:#999;}',
            '</style>',
            '<div class="preloader-refresh">',
                '下拉刷新',
            '</div>'
        ].join('');


        var moveTpl = [
            '<style>',
            '.preloader-loading-more {display: none; width: 100%;text-align: center;height: 40px;line-height:40px;background:#999;}',
            '</style>',
            '<div class="preloader-loading-more">',
                '加载更多',
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
        var that = this,
            currentY = e.touches[0].pageY,
            viewTop = viewHeight + that.scrollTop;
            // viewTop = viewHeight + elem.scrollTop();

        // 设置移动方向
        if ( currentY - that.startY > 0 ) {
            that.opts.movePosition = 'down';
        } else {
            that.opts.movePosition = 'up';
        }    
  
        var distance = currentY - that.startY;

        // 当前处于首屏，50像素容差值 && 向下滑动刷新
        if ( that.scrollTop < that.opts.distanceToRefresh && that.opts.movePosition === 'down'  ) {

            that.isPullToRefresh = true;
            that.$content[0].style[Util.prefixStyle('transform')] = 'translate(0,' + distance + 'px)' + Util.translateZ();
            e.preventDefault();
            return;
        }

        that.isPullToRefresh = false;
        
    };

    /**
     * 触摸结束
     */
    Refresh.prototype.touchEnd = function(e) {
        var that = this;

        if ( !that.isPullToRefresh ) {
            return;
        }

        // 添加动画事件
        that.$content[0].style[Util.prefixStyle('transition')] = 'all .3s';

        that.$content[0].style[Util.prefixStyle('transform')] = 'translate(0,0)' + Util.translateZ();

        that.$pullToRefresh.show();
        // 回调
        that.opts.refreshCallback && that.opts.refreshCallback();
        

        setTimeout(function() {
            that.$content[0].style[Util.prefixStyle('transform')] = '';
            that.$content[0].style[Util.prefixStyle('transition')] = '';
            
        }, 300)
    };

    /**
     * 加载更多
     */
    Refresh.prototype.getLoadMore = function(elem) {
        var that = this,
            scrollTop = elem.scrollTop(),
            viewTop = viewHeight + scrollTop,
            moreTime = null;


        if ( that.wrapHeight <= viewTop  && that.oldScrollTop < scrollTop && !that.isLoading ) {
            that.isLoading = true;

            that.$loadingMore.show();
            that.opts.loadingMoreCallback && that.opts.loadingMoreCallback();

            moreTime = setTimeout(function() {
                that.isLoading = false;
                that.wrapHeight = that.$content.height();
            }, 1000);
        }    
        
        that.oldScrollTop = scrollTop;

    };

    $.fn.refresh = function( options, callback ) {
        return this.each(function() {
            new Refresh( $(this), options, callback );
        })
    };
    
    // ADM 
    return Refresh;
}));
