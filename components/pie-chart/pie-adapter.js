/**
 * 饼图适配器模块
 * @description 负责生成饼图配置、更新数据、绑定事件
 * @version 1.0.0
 * @author 记账小程序团队
 */

/**
 * 默认饼图配置
 * @constant {Object}
 */
const DEFAULT_CONFIG = {
  // 默认颜色数组（分类颜色）- 使用更加鲜艳的配色方案
  colors: ['#17c4b6', '#2563eb', '#7c3aed', '#ec4899', '#f97316', '#fbbf24', '#84cc16', '#10b981', '#0ea5e9', '#f43f5e'],
  // 边框颜色
  borderColor: '#ffffff',
  // 边框宽度
  borderWidth: 2,
  // 标签字体大小
  labelFontSize: 11,
  // 标签颜色
  labelColor: '#333333',
  // 是否显示标签
  labelShow: true,
  // 标签格式化模板
  labelFormatter: '{b}: {d}%',
  // 图例字体大小
  legendFontSize: 11,
  // 图例颜色
  legendColor: '#666666'
};

/**
 * 生成饼图配置选项
 * @param {Array} pieData - 饼图数据数组
 * @param {Object} options - 配置选项
 * @param {String} options.chartType - 图表类型（income/expense）
 * @param {Boolean} options.showLegend - 是否显示图例
 * @param {Boolean} options.showLabel - 是否显示标签
 * @param {Number} options.chartHeight - 图表高度
 * @returns {Object} ECharts 配置对象
 */
function generatePieOption(pieData, options = {}) {
  // 合并默认配置
  const config = { ...DEFAULT_CONFIG, ...options };
  
  // 参数校验：pieData 必须是数组
  if (!Array.isArray(pieData)) {
    console.error('[pie-adapter] pieData 必须是数组');
    return {};
  }
  
  // 空数据处理
  if (pieData.length === 0) {
    console.warn('[pie-adapter] pieData 为空');
    return {};
  }
  
  // 构建饼图数据（添加颜色）
  const seriesData = pieData.map((item, index) => {
    // 获取颜色：优先使用item自身的color，否则从配置中选取
    const color = item.color || config.colors[index % config.colors.length];
    // 更新item的颜色属性（用于列表显示）
    item.color = color;
    return {
      name: item.name || `分类${index + 1}`,
      value: item.value || 0,
      itemStyle: {
        color: color
      }
    };
  });
  
  // 计算图表高度相关参数（使用百分比而非像素值）
  // ECharts的_parsePercent函数只支持百分比格式，不支持px格式
  const outerRadiusPercent = '20%'; // 外半径百分比（增大）
  const innerRadiusPercent = '10%'; // 内半径百分比（增大）
  
  // 构建并返回 ECharts 配置对象
  return {
    // 图例配置
    legend: {
      show: config.showLegend !== false,
      orient: 'horizontal',
      bottom: '10%',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        color: config.legendColor,
        fontSize: config.legendFontSize - 1
      }
    },
    
    // 数据系列配置
    series: [
      {
        type: 'pie',
        // 饼图中心位置
        center: ['50%', '45%'],
        // 圆环图半径配置（内半径和外半径，使用百分比）
        radius: [innerRadiusPercent, outerRadiusPercent],
        // 起始角度（从顶部开始）
        startAngle: 90,
        // 最小角度（防止小数据看不见）
        minAngle: 5,
        // 选中时偏移量
        selectedOffset: 10,
        // 数据
        data: seriesData,
        // 标签配置（圆环图外侧标签）
        label: {
          show: config.labelShow !== false,
          fontSize: config.labelFontSize,
          color: config.labelColor,
          // 标签格式化：显示分类名称和百分比
          formatter: config.labelFormatter,
          // 标签位置：外侧
          position: 'outer'
        },
        // 标签引导线配置
        labelLine: {
          show: config.labelShow !== false,
          // 第一段长度（从饼图到拐点）
          length: 20,
          // 第二段长度（从拐点到标签）
          length2: 15
        },
        // 强调样式（高亮）
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }
    ]
  };
}

/**
 * 更新饼图数据
 * @param {Object} instance - ECharts 实例
 * @param {Array} pieData - 新的饼图数据
 * @param {Object} options - 配置选项
 */
function updatePieData(instance, pieData, options = {}) {
  // 参数校验
  if (!instance) {
    console.error('[pie-adapter] ECharts 实例不存在');
    return;
  }
  
  // 生成新的配置
  const option = generatePieOption(pieData, options);
  
  // 设置配置（notMerge: true 表示不合并旧配置）
  instance.setOption(option, true);
}

/**
 * 聚合分类数据
 * @param {Array} bills - 账单数据数组
 * @param {String} type - 类型（income/expense）
 * @returns {Array} 聚合后的分类数据数组
 */
function aggregateByCategory(bills, type) {
  // 参数校验
  if (!Array.isArray(bills) || bills.length === 0) {
    return [];
  }
  
  // 使用 Map 进行聚合
  const categoryMap = new Map();
  
  // 遍历账单数据
  bills.forEach(bill => {
    // 获取账单类型和金额
    const billType = bill.type || (bill.amount < 0 ? 'income' : 'expense');
    const amount = Math.abs(bill.amount || 0);
    const category = bill.category || '其他';
    
    // 筛选指定类型的数据
    if (type === 'expense' && billType !== 'expense') return;
    if (type === 'income' && billType !== 'income') return;
    
    // 累加金额
    if (categoryMap.has(category)) {
      categoryMap.set(category, categoryMap.get(category) + amount);
    } else {
      categoryMap.set(category, amount);
    }
  });
  
  // 转换为数组并排序
  const result = [];
  categoryMap.forEach((value, name) => {
    result.push({ name, value });
  });
  
  // 按金额降序排序
  result.sort((a, b) => b.value - a.value);
  
  return result;
}

/**
 * 格式化饼图数据为显示格式
 * @param {Array} pieData - 饼图数据
 * @returns {Array} 格式化后的数据（带百分比）
 */
function formatPieData(pieData) {
  // 参数校验
  if (!Array.isArray(pieData) || pieData.length === 0) {
    return [];
  }
  
  // 计算总和
  const total = pieData.reduce((sum, item) => sum + (item.value || 0), 0);
  
  // 格式化数据
  return pieData.map(item => ({
    name: item.name,
    value: item.value,
    percent: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
  }));
}

/**
 * 导出模块方法
 */
module.exports = {
  // 默认配置
  DEFAULT_CONFIG,
  // 生成饼图配置
  generatePieOption,
  // 更新饼图数据
  updatePieData,
  // 聚合分类数据
  aggregateByCategory,
  // 格式化饼图数据
  formatPieData
};
