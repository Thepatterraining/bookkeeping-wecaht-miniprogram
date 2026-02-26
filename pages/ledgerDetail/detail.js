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
    loading: false // 加载状态
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
  }
}) 