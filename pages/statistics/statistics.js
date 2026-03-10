// pages/statistics/statistics.js
// 引入 dayjs 日期处理库（从 libs 目录引入）
const dayjs = require('../../libs/dayjs/dayjs.min');
// 引入 weekOfYear 插件，用于获取周数
const weekOfYear = require('../../libs/dayjs/plugin/weekOfYear');
// 引入 isoWeek 插件，用于 ISO 周计算
const isoWeek = require('../../libs/dayjs/plugin/isoWeek');
// 扩展 dayjs
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentMonth: '',
    expenseCategories: [
      { name: '餐饮', icon: 'icon-food', amount: 1500, percentage: 30 },
      { name: '交通', icon: 'icon-transport', amount: 800, percentage: 16 },
      { name: '购物', icon: 'icon-shopping', amount: 1200, percentage: 24 },
      { name: '娱乐', icon: 'icon-entertainment', amount: 500, percentage: 10 },
      { name: '其他', icon: 'icon-other', amount: 1000, percentage: 20 }
    ],
    incomeCategories: [
      { name: '工资', icon: 'icon-salary', amount: 8000, percentage: 80 },
      { name: '奖金', icon: 'icon-bonus', amount: 1000, percentage: 10 },
      { name: '其他', icon: 'icon-other', amount: 1000, percentage: 10 }
    ],
    totalExpense: 0,
    totalIncome: 0,
    balance: '0.00',
    balanceClass: 'income',
    categoryStats: [],
    bills: [],
    // 折线图数据
    chartData: [],
    // 当前时间维度
    timeDimension: 'day'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      currentMonth: this.formatMonth(new Date())
    })
    this.loadBills()
  },

  loadBills() {
    // TODO: 调用API获取账单数据
    const mockBills = [
      {
        id: 1,
        amount: 100,
        type: 'expense',
        category: '餐饮',
        date: '2024-03-20'
      },
      {
        id: 2,
        amount: 5000,
        type: 'income',
        category: '工资',
        date: '2024-03-15'
      }
    ]

    this.setData({ bills: mockBills })
    this.calculateStatistics()
    // 更新折线图数据
    this.updateChartData()
  },

  calculateStatistics() {
    const { bills, currentMonth } = this.data
    const monthBills = bills.filter(bill => bill.date.startsWith(currentMonth))

    // 计算总收支
    const totalExpense = monthBills
      .filter(bill => bill.type === 'expense')
      .reduce((sum, bill) => sum + bill.amount, 0)

    const totalIncome = monthBills
      .filter(bill => bill.type === 'income')
      .reduce((sum, bill) => sum + bill.amount, 0)

    // 计算分类统计
    const categoryMap = new Map()
    monthBills.forEach(bill => {
      const key = `${bill.type}-${bill.category}`
      const current = categoryMap.get(key) || 0
      categoryMap.set(key, current + bill.amount)
    })

    const categoryStats = Array.from(categoryMap.entries()).map(([key, amount]) => {
      const [type, category] = key.split('-')
      return { type, category, amount }
    })

    this.setData({
      totalExpense,
      totalIncome,
      categoryStats
    })
  },

  formatMonth(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  },

  formatDisplayMonth(monthStr) {
    const [year, month] = monthStr.split('-')
    return `${year}年${month}月`
  },

  onMonthChange(e) {
    this.setData({ currentMonth: e.detail.value })
    this.loadBills()
  },

  /**
   * 更新折线图数据
   * 根据当前时间维度调用对应的聚合方法
   */
  updateChartData() {
    const { bills, timeDimension } = this.data;
    let chartData = [];

    // 根据时间维度选择聚合方法
    switch (timeDimension) {
      case 'day':
        chartData = this.aggregateByDay(bills);
        break;
      case 'week':
        chartData = this.aggregateByWeek(bills);
        break;
      case 'month':
        chartData = this.aggregateByMonth(bills);
        break;
      default:
        chartData = this.aggregateByDay(bills);
    }

    // 更新图表数据
    this.setData({ chartData });
  },

  /**
   * 时间维度切换事件处理
   * @param {Object} e - 事件对象
   */
  onDimensionChange(e) {
    const { dimension } = e.detail;
    
    // 更新时间维度
    this.setData({ timeDimension: dimension });
    
    // 重新聚合数据
    this.updateChartData();
  },

  /**
   * 数据点点击事件处理
   * @param {Object} e - 事件对象
   */
  onDataPointClick(e) {
    const { seriesName, value, date } = e.detail;
    console.log('[statistics] 点击数据点:', { seriesName, value, date });
    
    // TODO: 可以在此处实现跳转到当日账单详情等功能
  },

  /**
   * 图表重试事件处理
   */
  onChartRetry() {
    // 重新加载账单数据
    this.loadBills();
  },

  /**
   * 按天聚合账单数据
   * 生成最近7天的收支数据
   * @param {Array} bills - 账单数据数组
   * @returns {Array} 按天聚合的数据数组
   *   格式: [{ date: '01-15', income: 10000, expense: 5000 }, ...]
   */
  aggregateByDay(bills) {
    // 参数校验
    if (!Array.isArray(bills)) {
      console.warn('[statistics] aggregateByDay: bills 不是数组');
      return [];
    }

    // 生成最近7天的日期数组
    const dateArray = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      dateArray.push({
        dateStr: date.format('YYYY-MM-DD'), // 完整日期，用于匹配
        displayDate: date.format('MM-DD') // 显示日期，用于图表
      });
    }

    // 初始化每日收支数据
    const dailyMap = new Map();
    dateArray.forEach(item => {
      dailyMap.set(item.dateStr, {
        date: item.displayDate,
        income: 0,
        expense: 0
      });
    });

    // 遍历账单，按日期聚合
    bills.forEach(bill => {
      // 获取账单日期（YYYY-MM-DD 格式）
      const billDate = bill.date || bill.time?.substring(0, 10);
      if (!billDate) return;

      // 检查是否在最近7天范围内
      if (!dailyMap.has(billDate)) return;

      // 获取当日数据
      const dayData = dailyMap.get(billDate);

      // 根据金额正负判断收支
      // 注意：项目中收入为负数，支出为正数
      const amount = bill.amount || 0;
      if (amount < 0) {
        // 收入（负数转正数）
        dayData.income += Math.abs(amount);
      } else {
        // 支出
        dayData.expense += amount;
      }
    });

    // 转换为数组返回
    return Array.from(dailyMap.values());
  },

  /**
   * 按周聚合账单数据
   * 生成最近4周的收支数据
   * @param {Array} bills - 账单数据数组
   * @returns {Array} 按周聚合的数据数组
   *   格式: [{ date: '第1周', income: 10000, expense: 5000 }, ...]
   */
  aggregateByWeek(bills) {
    // 参数校验
    if (!Array.isArray(bills)) {
      console.warn('[statistics] aggregateByWeek: bills 不是数组');
      return [];
    }

    // 获取当前日期
    const today = dayjs();
    // 获取本周的周一（ISO 周从周一开始）
    const thisMonday = today.isoWeekday(1);

    // 生成最近4周的周范围数组
    const weekArray = [];
    for (let i = 3; i >= 0; i--) {
      // 计算该周的周一
      const weekMonday = thisMonday.subtract(i, 'week');
      // 计算该周的周日
      const weekSunday = weekMonday.add(6, 'day');
      // 生成显示标签
      const weekLabel = `第${4 - i}周`;
      
      weekArray.push({
        startDate: weekMonday.format('YYYY-MM-DD'),
        endDate: weekSunday.format('YYYY-MM-DD'),
        label: weekLabel
      });
    }

    // 初始化每周收支数据
    const weeklyMap = new Map();
    weekArray.forEach(item => {
      weeklyMap.set(item.startDate, {
        date: item.label,
        startDate: item.startDate,
        endDate: item.endDate,
        income: 0,
        expense: 0
      });
    });

    // 遍历账单，按周聚合
    bills.forEach(bill => {
      // 获取账单日期（YYYY-MM-DD 格式）
      const billDate = bill.date || bill.time?.substring(0, 10);
      if (!billDate) return;

      // 查找该日期属于哪一周
      for (const [weekStart, weekData] of weeklyMap) {
        // 检查日期是否在该周范围内
        if (billDate >= weekData.startDate && billDate <= weekData.endDate) {
          // 根据金额正负判断收支
          const amount = bill.amount || 0;
          if (amount < 0) {
            // 收入（负数转正数）
            weekData.income += Math.abs(amount);
          } else {
            // 支出
            weekData.expense += amount;
          }
          // 找到匹配的周，跳出循环
          break;
        }
      }
    });

    // 转换为数组返回（只保留 date, income, expense 字段）
    return Array.from(weeklyMap.values()).map(item => ({
      date: item.date,
      income: item.income,
      expense: item.expense
    }));
  },

  /**
   * 按月聚合账单数据
   * 生成最近6个月的收支数据
   * @param {Array} bills - 账单数据数组
   * @returns {Array} 按月聚合的数据数组
   *   格式: [{ date: '01月', income: 10000, expense: 5000 }, ...]
   */
  aggregateByMonth(bills) {
    // 参数校验
    if (!Array.isArray(bills)) {
      console.warn('[statistics] aggregateByMonth: bills 不是数组');
      return [];
    }

    // 获取当前日期
    const today = dayjs();

    // 生成最近6个月的月份数组
    const monthArray = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = today.subtract(i, 'month');
      monthArray.push({
        yearMonth: monthDate.format('YYYY-MM'), // 完整月份，用于匹配
        displayMonth: monthDate.format('MM月') // 显示月份，用于图表
      });
    }

    // 初始化每月收支数据
    const monthlyMap = new Map();
    monthArray.forEach(item => {
      monthlyMap.set(item.yearMonth, {
        date: item.displayMonth,
        income: 0,
        expense: 0
      });
    });

    // 遍历账单，按月聚合
    bills.forEach(bill => {
      // 获取账单日期（YYYY-MM-DD 格式）
      const billDate = bill.date || bill.time?.substring(0, 10);
      if (!billDate) return;

      // 提取年月（YYYY-MM）
      const billYearMonth = billDate.substring(0, 7);

      // 检查是否在最近6个月范围内
      if (!monthlyMap.has(billYearMonth)) return;

      // 获取当月数据
      const monthData = monthlyMap.get(billYearMonth);

      // 根据金额正负判断收支
      const amount = bill.amount || 0;
      if (amount < 0) {
        // 收入（负数转正数）
        monthData.income += Math.abs(amount);
      } else {
        // 支出
        monthData.expense += amount;
      }
    });

    // 转换为数组返回
    return Array.from(monthlyMap.values());
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})