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
| 参数                               | 类型          | 说明                  |
| ---------------------------------- | ------------- | --------------------- |
| contentEl: #J_content              | String        | 内容ID                |
| isRefresh: true                    | Boolean       | 默认开启刷新	         | 
| isLoadingMore: true                | Boolean       | 默认开启加载更多	     | 
| distanceToRefresh: 100             | Number        | 下拉可刷新高度	     | 
| minDistanceToRefresh: 100          | Number        | 下拉最小阈值   	     | 
| maxDistanceToRefresh: 200          | Number        | 下拉最大阈值   	     | 
| interval: 5                        | Number        | 更新限制时间, 默认不限制 | 
| refreshCallback: function(){}      | Function      | 刷新回调              | 
| loadingMoreCallback: function(){}  | Function      | 加载更多回调          | 

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

## 更新版本
[v1.2内容](https://github.com/nevergiveup-j/zepto-refresh/wiki/%E6%9B%B4%E6%96%B0v1.2%E5%86%85%E5%AE%B9)

