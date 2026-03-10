/**
 * 饼图组件
 * 用于展示分类收支统计的饼图组件
 * 支持收入/支出切换、点击扇形查看详情
 */
// 引入饼图适配器模块
const pieAdapter = require('./pie-adapter');

Component({
  /**
   * 组件属性定义
   */
  properties: {
    /**
     * 图表标题
     * @type {String}
     */
    chartTitle: {
      type: String,
      value: '分类统计'
    },
    
    /**
     * 饼图数据数组
     * @type {Array}
     * 格式: 
     * 支出数据: [{ name: '餐饮', value: 1000 }, { name: '交通', value: 500 }, ...]
     * 收入数据: [{ name: '工资', value: 10000 }, { name: '奖金', value: 2000 }, ...]
     */
    expenseData: {
      type: Array,
      value: []
    },
    
    /**
     * 收入数据数组
     * @type {Array}
     */
    incomeData: {
      type: Array,
      value: []
    },
    
    /**
     * 默认显示类型
     * @type {String}
     * 可选值: 'expense' | 'income'
     */
    defaultType: {
      type: String,
      value: 'expense'
    },
    
    /**
     * 图表高度（单位：rpx）
     * @type {Number}
     */
    chartHeight: {
      type: Number,
      value: 320
    },
    
    /**
     * 是否显示图例
     * @type {Boolean}
     */
    showLegend: {
      type: Boolean,
      value: true
    },
    
    /**
     * 是否显示标签
     * @type {Boolean}
     */
    showLabel: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件数据
   */
  data: {
    // ECharts 实例配置
    ec: {
      onInit: null
    },
    
    // 当前选中的类型（income/expense）
    currentType: 'expense',
    
    // 是否为空数据状态
    isEmpty: false,
    
    // 是否发生错误
    hasError: false,
    
    // 错误信息
    errorMessage: ''
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    /**
     * 组件实例进入页面节点树时执行
     */
    attached() {
      // 设置默认类型
      this.setData({
        currentType: this.properties.defaultType
      });
      // 初始化图表
      this.initChart();
    },
    
    /**
     * 组件实例从页面节点树移除时执行
     */
    detached() {
      // 销毁图表实例
      this.disposeChart();
    }
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 初始化图表
     */
    initChart() {
      // 设置 ECharts 初始化回调
      this.setData({
        ec: {
          onInit: this.initChartCanvas.bind(this)
        }
      });
    },

    /**
     * 初始化 ECharts Canvas
     * @param {Object} canvas - Canvas 上下文
     * @param {Number} width - Canvas 宽度
     * @param {Number} height - Canvas 高度
     * @param {Number} pixelRatio - 设备像素比
     * @returns {Object} ECharts 实例
     */
    initChartCanvas(canvas, width, height, pixelRatio) {
      // 引入 ECharts 核心库（使用相对路径）
      const { echarts } = require('../../libs/echarts/ec-canvas/ec-canvas');
      
      // 初始化 ECharts 实例
      this.chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: pixelRatio || 1
      });
      
      // 存储 canvas 信息，供后续使用
      this.canvas = canvas;
      this.canvasWidth = width;
      this.canvasHeight = height;
      
      // 如果已有数据，进行渲染
      const currentData = this.getCurrentData();
      if (currentData && currentData.length > 0) {
        this.renderChart(currentData);
      } else {
        // 检查是否为空数据
        this.checkEmptyState();
      }
      
      // 返回 ECharts 实例
      return this.chart;
    },

    /**
     * 获取当前类型的数据
     * @returns {Array} 当前类型的数据数组
     */
    getCurrentData() {
      const { currentType } = this.data;
      return currentType === 'expense' 
        ? this.properties.expenseData 
        : this.properties.incomeData;
    },

    /**
     * 计算分类统计数据
     * 根据当前数据计算百分比和生成分类统计列表
     * @param {Array} data - 图表数据数组
     * @returns {Array} 分类统计数组
     */
    calculateCategoryStats(data) {
      // 参数检查
      if (!data || data.length === 0) {
        return [];
      }
      
      // 计算总值
      const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
      
      // 如果总值为0，返回空数组
      if (total === 0) {
        return [];
      }
      
      // 计算每个分类的百分比，并按百分比降序排序
      const stats = data.map((item, index) => {
        // 计算百分比（保留2位小数）
        const percent = ((item.value / total) * 100).toFixed(2);
        
        // 返回分类统计数据
        return {
          name: item.name || `分类${index + 1}`,
          value: item.value || 0,
          percent: parseFloat(percent),
          color: item.color || '#07c160'
        };
      });
      
      // 按百分比降序排序
      return stats.sort((a, b) => b.percent - a.percent);
    },

    /**
     * 渲染图表
     * @param {Array} data - 图表数据
     */
    renderChart(data) {
      // 如果图表实例不存在，跳过渲染
      if (!this.chart) {
        console.warn('[pie-chart] 图表实例不存在，无法渲染');
        return;
      }
      
      // 检查数据是否为空
      if (!data || data.length === 0) {
        this.setData({ isEmpty: true });
        return;
      }
      
      // 构建配置选项
      const options = {
        showLegend: this.properties.showLegend,
        showLabel: this.properties.showLabel,
        chartType: this.data.currentType,
        chartHeight: this.properties.chartHeight
      };
      
      // 使用适配器生成图表配置
      const option = pieAdapter.generatePieOption(data, options);
      
      // 设置图表配置
      this.chart.setOption(option);
      
      // 清除空状态
      this.setData({ 
        isEmpty: false, 
        hasError: false
      });
    },

    /**
     * 切换类型（收入/支出）
     * @param {Object} e - 事件对象
     */
    switchType(e) {
      // 获取点击的类型
      const type = e.currentTarget.dataset.type;
      
      // 如果类型相同，不做处理
      if (type === this.data.currentType) return;
      
      // 更新当前类型
      this.setData({ currentType: type });
      
      // 重新渲染图表
      const currentData = this.getCurrentData();
      
      // 检查是否为空数据
      if (!currentData || currentData.length === 0) {
        this.setData({ isEmpty: true });
      } else {
        this.renderChart(currentData);
      }
      
      // 触发类型切换事件，通知父组件
      this.triggerEvent('typechange', { type });
    },

    /**
     * 检查空数据状态
     */
    checkEmptyState() {
      const currentData = this.getCurrentData();
      const isEmpty = !currentData || currentData.length === 0;
      this.setData({ isEmpty });
    },

    /**
     * 重试加载
     * 点击错误状态的重试按钮时调用
     */
    retryLoad() {
      // 清除错误状态
      this.setData({
        hasError: false,
        errorMessage: ''
      });
      
      // 触发重试事件，通知父组件重新加载数据
      this.triggerEvent('retry');
    },

    /**
     * 销毁图表实例
     * 组件卸载时调用，释放资源
     */
    disposeChart() {
      // 检查图表实例是否存在
      if (this.chart) {
        // 销毁图表实例
        this.chart.dispose();
        this.chart = null;
      }
    }
  },

  /**
   * 组件属性观察器
   */
  observers: {
    /**
     * 监听支出数据变化
     * @param {Array} newData - 新的支出数据
     */
    'expenseData': function(newData) {
      // 如果当前显示的是支出，重新渲染
      if (this.data.currentType === 'expense' && this.chart) {
        if (!newData || newData.length === 0) {
          this.setData({ isEmpty: true });
        } else {
          this.renderChart(newData);
        }
      }
    },
    
    /**
     * 监听收入数据变化
     * @param {Array} newData - 新的收入数据
     */
    'incomeData': function(newData) {
      // 如果当前显示的是收入，重新渲染
      if (this.data.currentType === 'income' && this.chart) {
        if (!newData || newData.length === 0) {
          this.setData({ isEmpty: true });
        } else {
          this.renderChart(newData);
        }
      }
    }
  }
});
