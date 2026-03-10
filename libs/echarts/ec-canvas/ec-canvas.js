/**
 * ECharts 微信小程序适配组件
 * @description 用于在微信小程序中渲染 ECharts 图表
 * @version 1.0.0
 * @author 记账小程序团队
 */

// 引入 ECharts 核心库
const echarts = require('../echarts.min.js');

/**
 * ECharts Canvas 适配器类
 * @class EChartsAdapter
 */
class EChartsAdapter {
  /**
   * 构造函数
   * @param {Object} ctx - Canvas 上下文
   * @param {string} canvasId - Canvas 元素 ID
   * @param {Object} component - 组件实例
   */
  constructor(ctx, canvasId, component) {
    // 存储 Canvas 上下文
    this.ctx = ctx;
    // 存储 Canvas ID
    this.canvasId = canvasId;
    // 存储组件实例
    this.component = component;
    // ECharts 实例
    this.chart = null;
    // Canvas 宽度
    this.width = 0;
    // Canvas 高度
    this.height = 0;
    // 设备像素比
    this.dpr = 1;
  }

  /**
   * 初始化 ECharts 实例
   * @param {Function} callback - 初始化完成回调
   * @returns {void}
   */
  init(callback) {
    // 获取设备像素比
    this.dpr = wx.getSystemInfoSync().pixelRatio;
    
    // 获取 Canvas 节点信息
    const query = wx.createSelectorQuery().in(this.component);
    query.select(`#${this.canvasId}`)
      .fields({
        node: true,
        size: true
      })
      .exec((res) => {
        // 检查是否获取到 Canvas 节点
        if (!res || !res[0] || !res[0].node) {
          console.error('获取 Canvas 节点失败');
          return;
        }

        // 获取 Canvas 节点
        const canvas = res[0].node;
        // 获取 Canvas 宽度
        this.width = res[0].width;
        // 获取 Canvas 高度
        this.height = res[0].height;

        // 设置 Canvas 宽高（考虑设备像素比）
        canvas.width = this.width * this.dpr;
        canvas.height = this.height * this.dpr;

        // 创建 ECharts 实例
        this.chart = echarts.init(canvas, null, {
          width: this.width,
          height: this.height,
          devicePixelRatio: this.dpr
        });

        // 存储 Canvas 引用
        this.canvas = canvas;

        // 执行回调
        if (typeof callback === 'function') {
          callback(this.chart);
        }
      });
  }

  /**
   * 设置图表配置
   * @param {Object} option - ECharts 配置对象
   * @param {boolean} notMerge - 是否不合并配置
   * @returns {void}
   */
  setOption(option, notMerge = false) {
    // 检查图表实例是否存在
    if (!this.chart) {
      console.error('ECharts 实例未初始化');
      return;
    }
    // 设置配置
    this.chart.setOption(option, notMerge);
  }

  /**
   * 获取 ECharts 实例
   * @returns {Object|null} ECharts 实例
   */
  getChart() {
    return this.chart;
  }

  /**
   * 调整图表尺寸
   * @param {Object} opts - 尺寸配置
   * @returns {void}
   */
  resize(opts) {
    // 检查图表实例是否存在
    if (!this.chart) {
      return;
    }
    // 调整尺寸
    this.chart.resize(opts);
  }

  /**
   * 销毁 ECharts 实例
   * @returns {void}
   */
  dispose() {
    // 检查图表实例是否存在
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  }

  /**
   * 绑定触摸事件
   * @param {Object} canvas - Canvas 元素
   * @returns {void}
   */
  bindTouchEvents(canvas) {
    // 触摸开始事件处理
    canvas.addEventListener('touchstart', (e) => {
      // 如果图表实例存在，触发 ECharts 事件
      if (this.chart) {
        this.chart.getZr().handler.dispatch('mousedown', e);
      }
    });

    // 触摸移动事件处理
    canvas.addEventListener('touchmove', (e) => {
      // 如果图表实例存在，触发 ECharts 事件
      if (this.chart) {
        this.chart.getZr().handler.dispatch('mousemove', e);
      }
    });

    // 触摸结束事件处理
    canvas.addEventListener('touchend', (e) => {
      // 如果图表实例存在，触发 ECharts 事件
      if (this.chart) {
        this.chart.getZr().handler.dispatch('mouseup', e);
      }
    });
  }
}

/**
 * ECharts Canvas 组件定义
 * 微信小程序自定义组件
 */
Component({
  /**
   * 组件属性
   */
  properties: {
    /**
     * Canvas ID
     */
    canvasId: {
      type: String,
      value: 'ec-canvas'
    },
    
    /**
     * ECharts 配置对象
     * 包含 onInit 回调函数
     */
    ec: {
      type: Object
    },
    
    /**
     * 是否强制使用旧版 Canvas
     */
    forceUseOldCanvas: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件数据
   */
  data: {
    // Canvas 宽度（单位：px）
    canvasWidth: 300,
    // Canvas 高度（单位：px）
    canvasHeight: 200
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    /**
     * 组件实例进入页面节点树时执行
     */
    attached() {
      // 初始化图表
      this.initChart();
    },
    
    /**
     * 组件实例从页面节点树移除时执行
     */
    detached() {
      // 销毁图表实例
      if (this.chart) {
        this.chart.dispose();
        this.chart = null;
      }
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
      // 获取设备信息
      const systemInfo = wx.getSystemInfoSync();
      const pixelRatio = systemInfo.pixelRatio;
      
      // 获取 Canvas 节点
      const query = wx.createSelectorQuery().in(this);
      query.select(`#${this.data.canvasId}`)
        .fields({
          node: true,
          size: true
        })
        .exec((res) => {
          // 检查是否获取到 Canvas 节点
          if (!res || !res[0] || !res[0].node) {
            console.error('[ec-canvas] 获取 Canvas 节点失败');
            return;
          }

          // 获取 Canvas 节点
          const canvas = res[0].node;
          // 获取 Canvas 宽度
          const width = res[0].width;
          // 获取 Canvas 高度
          const height = res[0].height;

          // 更新 Canvas 尺寸到 data
          this.setData({
            canvasWidth: width,
            canvasHeight: height
          });

          // 设置 Canvas 宽高（考虑设备像素比）
          canvas.width = width * pixelRatio;
          canvas.height = height * pixelRatio;

          // 初始化 ECharts 实例
          this.chart = echarts.init(canvas, null, {
            width: width,
            height: height,
            devicePixelRatio: pixelRatio
          });

          // 存储 Canvas 引用
          this.canvas = canvas;

          // 如果有 onInit 回调，执行它
          if (this.properties.ec && typeof this.properties.ec.onInit === 'function') {
            this.properties.ec.onInit(canvas, width, height, pixelRatio);
          }
        });
    },

    /**
     * 触摸开始事件处理
     * @param {Object} e - 事件对象
     */
    touchStart(e) {
      // 如果图表实例存在，触发 ECharts 触摸事件
      if (this.chart) {
        this.chart._handleTouchEvent('touchstart', e);
      }
    },

    /**
     * 触摸移动事件处理
     * @param {Object} e - 事件对象
     */
    touchMove(e) {
      // 如果图表实例存在，触发 ECharts 触摸事件
      if (this.chart) {
        this.chart._handleTouchEvent('touchmove', e);
      }
    },

    /**
     * 触摸结束事件处理
     * @param {Object} e - 事件对象
     */
    touchEnd(e) {
      // 如果图表实例存在，触发 ECharts 触摸事件
      if (this.chart) {
        this.chart._handleTouchEvent('touchend', e);
      }
    }
  }
});

/**
 * 导出适配器和 ECharts 实例
 * 供外部模块使用
 */
module.exports = {
  EChartsAdapter,
  echarts
};
