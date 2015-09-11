Zepto.refresh.js
=======
实现下拉到底部和上拉到顶部再拉就出现刷新效果

## 查看效果地址
[Zepto.refresh](http://nevergiveup-j.github.io/Zepto.refresh/)

## 基于zepto框架
	<script src="zepto.min.js"></script>
	
## 引入zepto.refresh.js
	<script src="zepto.refresh.js"></script>

## options <code>Object</code>配置
	

## JS初始化
	$(window).refresh({
		// 内容元素
	  contentEl: '#J_scrller',
	  // 开启刷新事件，默认true
	  isRefresh: true,
	  // 刷新回调
	  refreshCallback: function(complete) {
			 
	  },
	  // 加载更多回调
	  loadingMoreCallback: function(complete) {
			
	  }
	});	
