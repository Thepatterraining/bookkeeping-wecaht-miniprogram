/**
 * ECharts 图表适配器模块
 * @description 负责生成 ECharts 图表配置、更新数据、绑定事件
 * @version 1.0.0
 * @author 记账小程序团队
 */

/**
 * 默认图表配置
 * @constant {Object}
 */
const DEFAULT_CONFIG = {
  // 收入线颜色（绿色）
  incomeColor: '#07c160',
  // 支出线颜色（红色）
  expenseColor: '#fa5151',
  // 线条宽度
  lineWidth: 2,
  // 数据点大小
  symbolSize: 6,
  // 是否平滑曲线
  smooth: true,
  // 渐变填充起始透明度
  areaOpacityStart: 0.3,
  // 渐变填充结束透明度
  areaOpacityEnd: 0.05,
  // 网格线颜色
  gridLineColor: '#f0f0f0',
  // 坐标轴线颜色
  axisLineColor: '#e0e0e0',
  // 标签文字颜色
  labelColor: '#999',
  // 标签字体大小
  labelFontSize: 10,
  // 提示框背景色
  tooltipBgColor: 'rgba(255, 255, 255, 0.95)',
  // 提示框边框色
  tooltipBorderColor: '#e0e0e0',
  // 提示框文字颜色
  tooltipTextColor: '#333',
  // 提示框字体大小
  tooltipFontSize: 12
};

/**
 * 生成图表配置选项
 * @param {Array} chartData - 图表数据数组
 * @param {Object} options - 配置选项
 * @param {Boolean} options.showLegend - 是否显示图例
 * @param {Boolean} options.showGrid - 是否显示网格线
 * @param {Boolean} options.enableDrag - 是否启用拖拽
 * @param {String} options.dimension - 时间维度（day/week/month）
 * @returns {Object} ECharts 配置对象
 */
function generateChartOption(chartData, options = {}) {
  // 合并默认配置
  const config = { ...DEFAULT_CONFIG, ...options };
  
  // 参数校验：chartData 必须是数组
  if (!Array.isArray(chartData)) {
    console.error('[echarts-adapter] chartData 必须是数组');
    return {};
  }
  
  // 空数据处理
  if (chartData.length === 0) {
    console.warn('[echarts-adapter] chartData 为空');
    return {};
  }
  
  // 提取日期数组作为 X 轴数据
  const dates = chartData.map(item => item.date || '');
  
  // 提取收入数据数组
  const incomeData = chartData.map(item => item.income || 0);
  
  // 提取支出数据数组
  const expenseData = chartData.map(item => item.expense || 0);
  
  // 构建并返回 ECharts 配置对象
  return {
    // 提示框配置
    tooltip: buildTooltipConfig(config),
    
    // 图例配置
    legend: {
      show: config.showLegend
    },
    
    // 网格配置
    grid: {
      left: '12%',
      right: '4%',
      top: '10%',
      bottom: config.enableDrag ? '20%' : '15%',
      containLabel: false
    },
    
    // X 轴配置
    xAxis: buildXAxisConfig(dates, config),
    
    // Y 轴配置
    yAxis: buildYAxisConfig(config),
    
    // 数据缩放配置（拖拽功能）
    dataZoom: config.enableDrag ? buildDataZoomConfig() : null,
    
    // 数据系列配置
    series: buildSeriesConfig(incomeData, expenseData, config)
  };
}

/**
 * 构建提示框配置
 * @param {Object} config - 配置对象
 * @returns {Object} 提示框配置
 */
function buildTooltipConfig(config) {
  return {
    trigger: 'axis',
    backgroundColor: config.tooltipBgColor,
    borderColor: config.tooltipBorderColor,
    borderWidth: 1,
    textStyle: {
      color: config.tooltipTextColor,
      fontSize: config.tooltipFontSize
    },
    formatter: formatTooltip
  };
}

/**
 * 构建 X 轴配置
 * @param {Array} dates - 日期数组
 * @param {Object} config - 配置对象
 * @returns {Object} X 轴配置
 */
function buildXAxisConfig(dates, config) {
  return {
    type: 'category',
    data: dates,
    axisLine: {
      lineStyle: {
        color: config.axisLineColor
      }
    },
    axisLabel: {
      color: config.labelColor,
      fontSize: config.labelFontSize,
      interval: 'auto'
    },
    axisTick: {
      show: false
    }
  };
}

/**
 * 构建 Y 轴配置
 * @param {Object} config - 配置对象
 * @returns {Object} Y 轴配置
 */
function buildYAxisConfig(config) {
  return {
    type: 'value',
    axisLine: {
      show: false
    },
    axisLabel: {
      color: config.labelColor,
      fontSize: config.labelFontSize,
      formatter: formatYAxisLabel
    },
    splitLine: {
      show: config.showGrid,
      lineStyle: {
        color: config.gridLineColor
      }
    }
  };
}

/**
 * 构建数据缩放配置（拖拽功能）
 * @returns {Array} 数据缩放配置数组
 */
function buildDataZoomConfig() {
  return [
    {
      type: 'inside',
      start: 0,
      end: 100,
      zoomOnMouseWheel: false,
      moveOnMouseMove: true,
      moveOnMouseWheel: true
    }
  ];
}

/**
 * 构建数据系列配置
 * @param {Array} incomeData - 收入数据数组
 * @param {Array} expenseData - 支出数据数组
 * @param {Object} config - 配置对象
 * @returns {Array} 数据系列配置数组
 */
function buildSeriesConfig(incomeData, expenseData, config) {
  return [
    // 收入系列
    {
      name: '收入',
      type: 'line',
      data: incomeData,
      smooth: config.smooth,
      symbol: 'circle',
      symbolSize: config.symbolSize,
      lineStyle: {
        width: config.lineWidth,
        color: config.incomeColor
      },
      itemStyle: {
        color: config.incomeColor
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: hexToRgba(config.incomeColor, config.areaOpacityStart) },
            { offset: 1, color: hexToRgba(config.incomeColor, config.areaOpacityEnd) }
          ]
        }
      }
    },
    // 支出系列
    {
      name: '支出',
      type: 'line',
      data: expenseData,
      smooth: config.smooth,
      symbol: 'circle',
      symbolSize: config.symbolSize,
      lineStyle: {
        width: config.lineWidth,
        color: config.expenseColor
      },
      itemStyle: {
        color: config.expenseColor
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: hexToRgba(config.expenseColor, config.areaOpacityStart) },
            { offset: 1, color: hexToRgba(config.expenseColor, config.areaOpacityEnd) }
          ]
        }
      }
    }
  ];
}

/**
 * 格式化提示框内容
 * @param {Array} params - ECharts 提示框参数
 * @returns {String} 格式化后的 HTML 字符串
 */
function formatTooltip(params) {
  // 参数校验
  if (!params || !Array.isArray(params) || params.length === 0) {
    return '';
  }
  
  // 获取日期
  const date = params[0].axisValue;
  
  // 构建提示框内容
  let content = `<div style="font-weight: 500; margin-bottom: 8px;">${date}</div>`;
  
  // 遍历数据系列
  params.forEach(param => {
    // 格式化金额（分转元）
    const amount = (param.value / 100).toFixed(2);
    
    // 添加颜色标识和数值
    content += `<div style="display: flex; align-items: center; margin: 4px 0;">`;
    content += `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${param.color}; margin-right: 8px;"></span>`;
    content += `<span>${param.seriesName}：¥${amount}</span>`;
    content += `</div>`;
  });
  
  return content;
}

/**
 * 格式化 Y 轴标签
 * @param {Number} value - 数值
 * @returns {String} 格式化后的字符串
 */
function formatYAxisLabel(value) {
  // 转换为元
  const yuan = value / 100;
  
  // 根据数值大小选择单位
  if (yuan >= 10000) {
    return (yuan / 10000).toFixed(1) + '万';
  }
  
  return yuan.toFixed(0);
}

/**
 * 更新图表数据
 * @param {Object} instance - ECharts 实例
 * @param {Array} chartData - 新的图表数据
 * @param {Object} options - 配置选项
 */
function updateChartData(instance, chartData, options = {}) {
  // 参数校验
  if (!instance) {
    console.error('[echarts-adapter] ECharts 实例不存在');
    return;
  }
  
  // 生成新的配置
  const option = generateChartOption(chartData, options);
  
  // 设置配置（notMerge: true 表示不合并旧配置）
  instance.setOption(option, true);
}

/**
 * 绑定图表事件
 * @param {Object} instance - ECharts 实例
 * @param {Object} callbacks - 事件回调对象
 * @param {Function} callbacks.onClick - 点击事件回调
 * @param {Function} callbacks.onDataZoom - 数据缩放事件回调
 */
function bindChartEvents(instance, callbacks = {}) {
  // 参数校验
  if (!instance) {
    console.error('[echarts-adapter] ECharts 实例不存在');
    return;
  }
  
  // 绑定点击事件
  if (typeof callbacks.onClick === 'function') {
    instance.on('click', (params) => {
      callbacks.onClick({
        seriesName: params.seriesName,
        value: params.value,
        dataIndex: params.dataIndex,
        date: params.name
      });
    });
  }
  
  // 绑定数据缩放事件
  if (typeof callbacks.onDataZoom === 'function') {
    instance.on('dataZoom', (params) => {
      callbacks.onDataZoom({
        start: params.start,
        end: params.end,
        batch: params.batch
      });
    });
  }
}

/**
 * HEX 颜色转 RGBA
 * @param {String} hex - HEX 颜色值
 * @param {Number} alpha - 透明度（0-1）
 * @returns {String} RGBA 颜色字符串
 */
function hexToRgba(hex, alpha) {
  // 移除 # 前缀
  hex = hex.replace('#', '');
  
  // 解析 R、G、B 值
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // 返回 RGBA 字符串
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 导出模块方法
 */
module.exports = {
  // 默认配置
  DEFAULT_CONFIG,
  // 生成图表配置
  generateChartOption,
  // 更新图表数据
  updateChartData,
  // 绑定图表事件
  bindChartEvents,
  // 格式化提示框内容
  formatTooltip,
  // 格式化 Y 轴标签
  formatYAxisLabel,
  // 工具方法
  hexToRgba
};
