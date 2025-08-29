Component({
  // 组件的属性列表
  properties: {
    ledgerNo: {
      type: String,
      value: '' // 账本编号
    }
  },

  // 组件的初始数据
  data: {
    loading: false, // 加载中
    error: '', // 错误信息
    income: 0, // 收入总额（单位：分）
    expense: 0, // 支出总额（单位：分）
    balance: 0, // 结余（单位：分）
    currentYear: new Date().getFullYear(), // 当前选择的年份
    currentMonth: new Date().getMonth() + 1, // 当前选择的月份
    showPicker: false, // 是否显示月份选择器
    years: [], // 可选年份列表
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // 可选月份列表
  },

  // 组件的生命周期
  lifetimes: {
    attached() {
      // 初始化年份列表
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = currentYear - 5; i <= currentYear; i++) {
        years.push(i);
      }
      this.setData({ years });

      // 初次加载数据
      this.fetchSummary();
    }
  },

  // 属性监听器
  observers: {
    'ledgerNo': function(next) {
      if (next) {
        this.fetchSummary(); // ledgerNo 变化时重新拉取
      }
    }
  },

  // 组件的方法列表
  methods: {
    // 获取账单汇总数据
    fetchSummary() {
      const { ledgerNo, currentYear, currentMonth } = this.data;
      if (!ledgerNo) {
        this.setData({ error: '账本编号不能为空' });
        return;
      }

      this.setData({ loading: true, error: '' });

      wx.request({
        url: 'http://localhost:9002/transactionStatement/summary',
        method: 'GET',
        data: {
          ledgerNo,
          year: currentYear,
          month: currentMonth
        },
        header: { 'content-type': 'application/json' },
        success: (res) => {
          const d = res && res.data;
          if (d && d.code === 200 && d.data) {
            // 处理汇总数据
            const income = d.data.income || 0;
            const expense = d.data.expense || 0;
            const balance = income - expense;

            this.setData({
              income,
              expense,
              balance
            });

            // 触发汇总数据更新事件
            this.triggerEvent('summaryupdate', {
              income,
              expense,
              balance,
              year: currentYear,
              month: currentMonth
            });
          } else {
            this.setData({ error: '获取账单汇总失败' });
          }
        },
        fail: (err) => {
          this.setData({ error: '网络错误，请检查服务是否启动' });
          console.error('获取账单汇总失败:', err);
        },
        complete: () => {
          this.setData({ loading: false });
        }
      });
    },

    // 格式化金额，将分转换为元并保留两位小数
    formatAmount(amount) {
      const n = Number(amount || 0) / 100;
      return n.toFixed(2);
    },

    // 显示月份选择器
    showMonthPicker() {
      this.setData({ showPicker: true });
    },

    // 隐藏月份选择器
    hideMonthPicker() {
      this.setData({ showPicker: false });
    },

    // 选择年份
    onYearChange(e) {
      const year = this.data.years[e.detail.value];
      this.setData({ currentYear: year });
    },

    // 选择月份
    onMonthChange(e) {
      const month = this.data.months[e.detail.value];
      this.setData({ currentMonth: month });
    },

    // 确认选择
    confirmPicker() {
      this.hideMonthPicker();
      this.fetchSummary(); // 重新获取数据
    }
  }
})
