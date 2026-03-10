/**
 * 折线图组件
 * 用于展示收支趋势的折线图组件
 * 支持按日/周/月维度切换、数据点拖拽查看
 */
// 引入 ECharts 适配器模块
const echartsAdapter = require('./echarts-adapter');

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
      value: '收支趋势'
    },
    
    /**
     * 账单数据数组
     * @type {Array}
     * 格式: [{ date: '2024-01-01', income: 10000, expense: 5000 }, ...]
     */
    chartData: {
      type: Array,
      value: [],
      observer: 'onDataChange' // 数据变化时触发重新渲染
    },
    
    /**
     * 默认时间维度
     * @type {String}
     * 可选值: 'day' | 'week' | 'month'
     */
    defaultDimension: {
      type: String,
      value: 'day'
    },
    
    /**
     * 图表高度（单位：rpx）
     * @type {Number}
     */
    chartHeight: {
      type: Number,
      value: 400
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
     * 是否显示网格线
     * @type {Boolean}
     */
    showGrid: {
      type: Boolean,
      value: true
    },
    
    /**
     * 是否启用数据点拖拽查看
     * @type {Boolean}
     * 启用后可通过滑动/拖拽查看不同数据点的 tooltip
     */
    enableDrag: {
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
    
    // 当前选中的时间维度
    currentDimension: 'day',
    
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
     * 在此设置 ECharts 初始化回调
     */
    attached() {
      // 设置默认时间维度
      this.setData({
        currentDimension: this.properties.defaultDimension
      });
      
      // 设置 ECharts 初始化回调
      // 使用 ec.onInit 模式，这是 ec-canvas 组件的标准初始化方式
      this.setData({
        ec: {
          onInit: this.initChart.bind(this)
        }
      });
    },
    
    /**
     * 组件实例从页面节点树移除时执行
     */
    detached() {
      // 销毁 ECharts 实例，释放资源
      this.disposeChart();
    }
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 切换时间维度
     * @param {Object} e - 事件对象
     */
    switchDimension(e) {
      // 获取点击的维度值
      const dimension = e.currentTarget.dataset.dimension;
      
      // 如果点击的是当前维度，不做处理
      if (dimension === this.data.currentDimension) {
        return;
      }
      
      // 更新当前维度
      this.setData({
        currentDimension: dimension
      });
      
      // 触发维度变化事件，通知父组件
      this.triggerEvent('dimensionchange', {
        dimension: dimension
      });
    },

    /**
     * 数据变化观察器
     * 当 chartData 属性发生变化时调用
     * @param {Array} newData - 新的数据数组
     */
    onDataChange(newData) {
      // 检查数据是否为空
      const isEmpty = !newData || newData.length === 0;
      
      // 更新空状态
      this.setData({
        isEmpty: isEmpty,
        hasError: false,
        errorMessage: ''
      });
      
      // 如果数据为空，不渲染
      if (isEmpty) {
        return;
      }
      
      // 校验数据格式
      const validationResult = this.validateChartData(newData);
      if (!validationResult.valid) {
        // 数据格式不正确，设置错误状态
        this.setError(validationResult.message);
        return;
      }
      
      // 数据有效，重新渲染图表
      this.renderChart(newData);
    },

    /**
     * 初始化 ECharts 图表
     * 作为 ec.onInit 回调使用
     * @param {Object} canvas - Canvas 上下文
     * @param {Number} width - Canvas 宽度
     * @param {Number} height - Canvas 高度
     * @param {Number} pixelRatio - 设备像素比
     * @returns {Object} ECharts 实例
     */
    initChart(canvas, width, height, pixelRatio) {
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
      
      // 绑定图表事件
      this.bindChartEvents();
      
      // 如果已有数据，进行渲染
      if (this.properties.chartData && this.properties.chartData.length > 0) {
        this.renderChart(this.properties.chartData);
      }
      
      // 返回 ECharts 实例
      return this.chart;
    },

    /**
     * 绑定图表事件
     * 使用 echarts-adapter 模块的事件绑定方法
     */
    bindChartEvents() {
      // 使用适配器绑定图表事件
      echartsAdapter.bindChartEvents(this.chart, {
        // 点击数据点事件回调
        onClick: (params) => {
          // 触发数据点点击事件，通知父组件
          this.triggerEvent('datapointclick', params);
        },
        // 数据缩放事件回调
        onDataZoom: (params) => {
          // 触发数据缩放事件，通知父组件
          this.triggerEvent('datazoom', params);
        }
      });
    },

    /**
     * 渲染图表
     * @param {Array} data - 图表数据
     */
    renderChart(data) {
      // 如果图表实例不存在，跳过渲染
      if (!this.chart) {
        console.warn('[line-chart] 图表实例不存在，无法渲染');
        return;
      }
      
      // 构建配置选项
      const options = {
        showLegend: this.properties.showLegend,
        showGrid: this.properties.showGrid,
        enableDrag: this.properties.enableDrag,
        dimension: this.data.currentDimension
      };
      
      // 使用适配器生成图表配置
      const option = echartsAdapter.generateChartOption(data, options);
      
      // 设置图表配置
      this.chart.setOption(option);
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
      if (this.chart) {
        this.chart.dispose();
        this.chart = null;
      }
    },

    /**
     * 校验图表数据格式
     * @param {Array} data - 图表数据数组
     * @returns {Object} 校验结果 { valid: Boolean, message: String }
     */
    validateChartData(data) {
      // 检查是否为数组
      if (!Array.isArray(data)) {
        return {
          valid: false,
          message: '数据格式错误：chartData 必须是数组'
        };
      }
      
      // 空数组视为有效
      if (data.length === 0) {
        return { valid: true, message: '' };
      }
      
      // 遍历检查每项数据格式
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        
        // 检查是否为对象
        if (typeof item !== 'object' || item === null) {
          return {
            valid: false,
            message: `数据格式错误：第 ${i + 1} 项不是有效对象`
          };
        }
        
        // 检查 date 字段
        if (!item.date || typeof item.date !== 'string') {
          return {
            valid: false,
            message: `数据格式错误：第 ${i + 1} 项缺少 date 字段或格式不正确`
          };
        }
        
        // 检查 income 字段（可选，但必须为数字）
        if (item.income !== undefined && typeof item.income !== 'number') {
          return {
            valid: false,
            message: `数据格式错误：第 ${i + 1} 项 income 字段必须为数字`
          };
        }
        
        // 检查 expense 字段（可选，但必须为数字）
        if (item.expense !== undefined && typeof item.expense !== 'number') {
          return {
            valid: false,
            message: `数据格式错误：第 ${i + 1} 项 expense 字段必须为数字`
          };
        }
      }
      
      // 校验通过
      return { valid: true, message: '' };
    },

    /**
     * 设置错误状态
     * @param {String} message - 错误信息
     */
    setError(message) {
      // 输出错误日志
      console.error('[line-chart]', message);
      
      // 更新错误状态
      this.setData({
        hasError: true,
        errorMessage: message || '数据加载失败',
        isEmpty: false
      });
    },

    /**
     * 清除错误状态
     */
    clearError() {
      this.setData({
        hasError: false,
        errorMessage: ''
      });
    }
  }
});
