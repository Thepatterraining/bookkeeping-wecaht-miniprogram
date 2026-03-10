// 引入 dayjs 日期处理库（用于统计功能）
const dayjs = require('../../libs/dayjs/dayjs.min');
// 引入 weekOfYear 插件，用于获取周数
const weekOfYear = require('../../libs/dayjs/plugin/weekOfYear');
// 引入 isoWeek 插件，用于 ISO 周计算
const isoWeek = require('../../libs/dayjs/plugin/isoWeek');
// 扩展 dayjs
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

Page({
  data: {
    ledgerNo: '',
    tab: 'bill',
    ledgerInfo: {}, // 账本基本信息
    monthBudget: {
      total: 0, // 预算金额
      used: 0   // 已使用金额
    },
    monthSummary: {
      income: 0, // 收入金额
      expense: 0, // 支出金额
      balance: 0  // 结余金额
    },
    showBudgetModal: false, // 控制预算设置弹窗显示
    newBudgetAmount: '', // 新预算金额
    currentYear: new Date().getFullYear(), // 当前选择的年份
    currentMonth: new Date().getMonth() + 1, // 当前选择的月份
    loading: false, // 加载状态
    // 统计相关数据
    statBills: [], // 账单数据（用于统计）
    chartData: [], // 折线图数据
    timeDimension: 'day', // 当前时间维度
    // 饼图相关数据
    expenseCategoryData: [], // 支出分类数据
    incomeCategoryData: [] // 收入分类数据
  },

  onLoad(options) {
    // 设置账本编号和初始标签页
    this.setData({
      ledgerNo: options.ledgerNo || '',
      tab: options.tab || 'bill' // 从URL参数中获取tab，默认为'bill'
    });

    // 获取账本详情
    this.fetchLedgerDetail();
  },

  // 格式化月份，小于10前面加0
  formatMonth(month) {
    return String(month).padStart(2, '0');
  },

  // 获取账本详情
  fetchLedgerDetail() {
    const { ledgerNo } = this.data;
    if (!ledgerNo) {
      wx.showToast({
        title: '账本编号不能为空',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    wx.request({
      url: 'http://localhost:9002/ledger/detail',
      method: 'GET',
      data: {
        ledgerNo: ledgerNo
      },
      header: { 'content-type': 'application/json' },
      success: (res) => {
        const resp = res && res.data;
        if (resp && resp.code === 200 && resp.data) {
          // 处理账本详情数据
          this.processLedgerDetail(resp.data);
        } else {
          wx.showToast({
            title: '获取账本详情失败',
            icon: 'none'
          });
          // 使用默认数据
          this.fetchMonthData();
        }
      },
      fail: (err) => {
        console.error('获取账本详情失败:', err);
        wx.showToast({
          title: '网络错误，请检查服务是否启动',
          icon: 'none'
        });
        // 使用默认数据
        this.fetchMonthData();
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 处理账本详情数据
  processLedgerDetail(data) {
    if (!data) return;

    // 保存账本基本信息
    this.setData({
      ledgerInfo: {
        ledgerName: data.ledgerName || '',
        ledgerNo: data.ledgerNo || '',
        ledgerStatus: data.ledgerStatus || '',
        ledgerDesc: data.ledgerDesc || '',
        ledgerImage: data.ledgerImage || ''
      }
    });

    // 处理预算信息
    if (data.ledgerBudget) {
      // 将字符串金额转换为数字（单位：元）
      const amount = this.parseAmount(data.ledgerBudget.amount);
      const used = this.parseAmount(data.ledgerBudget.used);
      const remained = this.parseAmount(data.ledgerBudget.remained);

      this.setData({
        monthBudget: {
          total: amount,
          used: used,
          remained: remained,
          budgetDate: data.ledgerBudget.budgetDate || ''
        }
      });
    }

    // 处理收支统计信息
    if (data.ledgerSummary) {
      // 确保数据是数字类型
      const income = Number(data.ledgerSummary.income || 0);
      const expense = Number(data.ledgerSummary.expense || 0);
      const remained = Number(data.ledgerSummary.remained || 0);

      this.setData({
        monthSummary: {
          income: income,
          expense: expense,
          balance: remained
        }
      });
    }

    // 更新账单列表
    this.updateBillList();
  },

  // 将金额转换为数字（单位：元）
  parseAmount(amountStr) {
    if (amountStr === undefined || amountStr === null) return 0;

    // 如果已经是数字类型，直接返回
    if (typeof amountStr === 'number') return amountStr;

    try {
      // 移除可能的货币符号和千位分隔符，然后转换为数字
      const cleanStr = String(amountStr).replace(/[^\d.-]/g, '');
      const amount = parseFloat(cleanStr);
      return isNaN(amount) ? 0 : amount;
    } catch (e) {
      console.error('金额转换错误:', e);
      return 0;
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ tab });
    
    // 切换到统计tab时加载数据
    if (tab === 'stat') {
      this.loadStatData();
    }
  },

  // 获取月度数据（备用方法，当API调用失败时使用）
  fetchMonthData() {
    const { currentYear, currentMonth } = this.data;

    // 使用模拟数据
    setTimeout(() => {
      // 根据月份生成不同的模拟数据
      const seed = currentMonth * 100 + (currentYear % 100);
      const baseIncome = 10000; // 基础收入10000元
      const baseExpense = 7000; // 基础支出7000元

      // 根据月份变化收支金额
      const income = baseIncome + (seed % 5000);
      const expense = baseExpense + (seed % 3000);

      this.setData({
        'monthSummary.income': income,
        'monthSummary.expense': expense,
        'monthSummary.balance': income - expense,
        'monthBudget.total': 10000, // 10000元
        'monthBudget.used': expense
      });

      // 更新账单列表
      this.updateBillList();
    }, 300);
  },

  // 更新账单列表
  updateBillList() {
    const billList = this.selectComponent('#billList');
    if (billList) {
      billList.updateYearMonth(this.data.currentYear, this.data.currentMonth);
    }
  },

  // 月份变更处理
  onMonthChange(e) {
    const { year, month } = e.detail;

    this.setData({
      currentYear: year,
      currentMonth: month
    });

    // 重新获取数据
    this.fetchLedgerDetail();
  },

  // 显示设置预算弹窗
  onSetBudget() {
    this.setData({
      showBudgetModal: true,
      newBudgetAmount: String(this.data.monthBudget.total) // 单位已经是元
    });
  },

  // 隐藏预算弹窗
  hideBudgetModal() {
    this.setData({
      showBudgetModal: false
    });
  },

  // 监听预算金额输入
  onBudgetAmountInput(e) {
    let value = e.detail.value;

    // 只保留数字，移除所有非数字字符
    value = value.replace(/\D/g, '');

    // 移除前导零
    value = value.replace(/^0+/, '');

    // 如果清空了，允许为空字符串
    if (value === '') {
      this.setData({ newBudgetAmount: '' });
      return;
    }

    // 转换为数字验证范围
    const numValue = parseInt(value, 10);

    // 限制最大值为9999999（小于10000000）
    if (numValue > 9999999) {
      value = '9999999';
      wx.showToast({
        title: '预算金额不能超过9999999',
        icon: 'none'
      });
    }

    this.setData({
      newBudgetAmount: value
    });
  },

  // 保存预算设置
  saveBudget() {
    const amount = parseInt(this.data.newBudgetAmount, 10);

    if (isNaN(amount) || amount <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }

    // 验证金额上限（小于10000000）
    if (amount >= 10000000) {
      wx.showToast({
        title: '预算金额不能超过9999999',
        icon: 'none'
      });
      return;
    }

    const { currentYear, currentMonth } = this.data;
    const formattedMonth = this.formatMonth(currentMonth); // 格式化月份
    const currentDate = `${currentYear}-${formattedMonth}-01`;

    // 这里应该调用后端接口保存预算设置
    wx.request({
      url: 'http://localhost:9002/ledger/update/budget',
      method: 'POST',
      data: {
        ledgerNo: this.data.ledgerNo,
        budgetAmount: amount,
        budgetDate: currentDate
      },
      header: { 'content-type': 'application/json' },
      success: (res) => {
        const resp = res && res.data;
        if (resp && resp.code === 200) {
          wx.showToast({
            title: '预算设置成功',
            icon: 'success'
          });

          // 更新本地预算数据
          this.setData({
            'monthBudget.total': amount, // 单位是元
            showBudgetModal: false
          });

          // 重新获取账本详情
          this.fetchLedgerDetail();
        } else {
          wx.showToast({
            title: resp?.message || '预算设置失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('预算设置失败:', err);
        wx.showToast({
          title: '网络错误，请检查服务是否启动',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ showBudgetModal: false });
      }
    });
  },

  // 防止滚动穿透
  preventTouchMove() {
    return false;
  },

  // ==================== 统计相关方法 ====================

  /**
   * 加载统计数据
   * 当切换到统计tab时调用
   */
  loadStatData() {
    // TODO: 调用API获取账单数据
    // 这里使用模拟数据
    const mockBills = [
      // 支出数据
      { id: 1, amount: 150, type: 'expense', category: '餐饮', date: dayjs().format('YYYY-MM-DD') },
      { id: 2, amount: 80, type: 'expense', category: '交通', date: dayjs().subtract(1, 'day').format('YYYY-MM-DD') },
      { id: 3, amount: 200, type: 'expense', category: '购物', date: dayjs().subtract(2, 'day').format('YYYY-MM-DD') },
      { id: 4, amount: 300, type: 'expense', category: '餐饮', date: dayjs().subtract(3, 'day').format('YYYY-MM-DD') },
      { id: 5, amount: 120, type: 'expense', category: '娱乐', date: dayjs().subtract(4, 'day').format('YYYY-MM-DD') },
      { id: 6, amount: 500, type: 'expense', category: '购物', date: dayjs().subtract(5, 'day').format('YYYY-MM-DD') },
      { id: 7, amount: 60, type: 'expense', category: '交通', date: dayjs().subtract(6, 'day').format('YYYY-MM-DD') },
      { id: 8, amount: 180, type: 'expense', category: '餐饮', date: dayjs().subtract(1, 'day').format('YYYY-MM-DD') },
      { id: 9, amount: 350, type: 'expense', category: '医疗', date: dayjs().subtract(2, 'day').format('YYYY-MM-DD') },
      { id: 10, amount: 90, type: 'expense', category: '娱乐', date: dayjs().subtract(3, 'day').format('YYYY-MM-DD') },
      // 收入数据
      { id: 11, amount: 8000, type: 'income', category: '工资', date: dayjs().subtract(2, 'day').format('YYYY-MM-DD') },
      { id: 12, amount: 500, type: 'income', category: '奖金', date: dayjs().subtract(3, 'day').format('YYYY-MM-DD') },
      { id: 13, amount: 200, type: 'income', category: '理财', date: dayjs().subtract(5, 'day').format('YYYY-MM-DD') },
      { id: 14, amount: 1000, type: 'income', category: '兼职', date: dayjs().subtract(6, 'day').format('YYYY-MM-DD') }
    ];
    
    // 更新账单数据和图表数据
    this.setData({ statBills: mockBills });
    this.updateChartData();
    // 更新分类数据（用于饼图）
    this.updateCategoryData();
  },

  /**
   * 更新折线图数据
   */
  updateChartData() {
    const { statBills, timeDimension } = this.data;
    let chartData = [];

    switch (timeDimension) {
      case 'day':
        chartData = this.aggregateByDay(statBills);
        break;
      case 'week':
        chartData = this.aggregateByWeek(statBills);
        break;
      case 'month':
        chartData = this.aggregateByMonth(statBills);
        break;
      default:
        chartData = this.aggregateByDay(statBills);
    }

    this.setData({ chartData });
  },

  /**
   * 时间维度切换事件
   */
  onDimensionChange(e) {
    const { dimension } = e.detail;
    this.setData({ timeDimension: dimension });
    this.updateChartData();
  },

  /**
   * 数据点点击事件
   */
  onDataPointClick(e) {
    console.log('[ledgerDetail] 点击数据点:', e.detail);
  },

  /**
   * 图表重试事件
   */
  onChartRetry() {
    this.loadStatData();
  },

  /**
   * 饼图类型切换事件
   */
  onPieTypeChange(e) {
    console.log('[ledgerDetail] 饼图类型切换:', e.detail);
  },

  /**
   * 饼图重试事件
   */
  onPieRetry() {
    this.loadStatData();
  },

  /**
   * 按天聚合
   */
  aggregateByDay(bills) {
    if (!Array.isArray(bills)) return [];

    const dateArray = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      dateArray.push({
        dateStr: date.format('YYYY-MM-DD'),
        displayDate: date.format('MM-DD')
      });
    }

    const dailyMap = new Map();
    dateArray.forEach(item => {
      dailyMap.set(item.dateStr, {
        date: item.displayDate,
        income: 0,
        expense: 0
      });
    });

    bills.forEach(bill => {
      const billDate = bill.date || bill.time?.substring(0, 10);
      if (!billDate || !dailyMap.has(billDate)) return;

      const dayData = dailyMap.get(billDate);
      const amount = bill.amount || 0;
      if (amount < 0) {
        dayData.income += Math.abs(amount);
      } else {
        dayData.expense += amount;
      }
    });

    return Array.from(dailyMap.values());
  },

  /**
   * 按周聚合
   */
  aggregateByWeek(bills) {
    if (!Array.isArray(bills)) return [];

    const today = dayjs();
    const thisMonday = today.isoWeekday(1);
    const weekArray = [];

    for (let i = 3; i >= 0; i--) {
      const weekMonday = thisMonday.subtract(i, 'week');
      const weekSunday = weekMonday.add(6, 'day');
      weekArray.push({
        startDate: weekMonday.format('YYYY-MM-DD'),
        endDate: weekSunday.format('YYYY-MM-DD'),
        label: `第${4 - i}周`
      });
    }

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

    bills.forEach(bill => {
      const billDate = bill.date || bill.time?.substring(0, 10);
      if (!billDate) return;

      for (const [, weekData] of weeklyMap) {
        if (billDate >= weekData.startDate && billDate <= weekData.endDate) {
          const amount = bill.amount || 0;
          if (amount < 0) {
            weekData.income += Math.abs(amount);
          } else {
            weekData.expense += amount;
          }
          break;
        }
      }
    });

    return Array.from(weeklyMap.values()).map(item => ({
      date: item.date,
      income: item.income,
      expense: item.expense
    }));
  },

  /**
   * 按月聚合
   */
  aggregateByMonth(bills) {
    if (!Array.isArray(bills)) return [];

    const today = dayjs();
    const monthArray = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = today.subtract(i, 'month');
      monthArray.push({
        yearMonth: monthDate.format('YYYY-MM'),
        displayMonth: monthDate.format('MM月')
      });
    }

    const monthlyMap = new Map();
    monthArray.forEach(item => {
      monthlyMap.set(item.yearMonth, {
        date: item.displayMonth,
        income: 0,
        expense: 0
      });
    });

    bills.forEach(bill => {
      const billDate = bill.date || bill.time?.substring(0, 10);
      if (!billDate) return;

      const billYearMonth = billDate.substring(0, 7);
      if (!monthlyMap.has(billYearMonth)) return;

      const monthData = monthlyMap.get(billYearMonth);
      const amount = bill.amount || 0;
      if (amount < 0) {
        monthData.income += Math.abs(amount);
      } else {
        monthData.expense += amount;
      }
    });

    return Array.from(monthlyMap.values());
  },

  /**
   * 按分类聚合数据
   * @param {Array} bills - 账单数据
   * @param {String} type - 类型（income/expense）
   * @returns {Array} 聚合后的分类数据
   */
  aggregateByCategory(bills, type) {
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
  },

  /**
   * 更新分类数据
   */
  updateCategoryData() {
    const { statBills } = this.data;

    // 聚合支出分类数据
    const expenseCategoryData = this.aggregateByCategory(statBills, 'expense');
    // 聚合收入分类数据
    const incomeCategoryData = this.aggregateByCategory(statBills, 'income');

    // 更新数据
    this.setData({
      expenseCategoryData,
      incomeCategoryData
    });
  }
}) 