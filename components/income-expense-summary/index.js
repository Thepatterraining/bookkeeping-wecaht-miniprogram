// components/income-expense-summary/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 收入金额（单位：元）
    income: {
      type: Number,
      value: 0
    },
    // 支出金额（单位：元）
    expense: {
      type: Number,
      value: 0
    },
    // 月份，格式为YYYY-MM
    month: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 结余金额（单位：元）
    balance: 0,
    // 当前月份显示
    currentMonth: '',
    // 是否显示月份选择器
    showPicker: false,
    // 可选年份列表
    years: [],
    // 可选月份列表
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    // 选择器当前值
    pickerValue: [0, 0],
    // 当前选择的年份
    selectedYear: 0,
    // 当前选择的月份
    selectedMonth: 0
  },

  /**
   * 数据监听器
   */
  observers: {
    'income, expense': function(income, expense) {
      // 计算结余
      const balance = income - expense;
      this.setData({ balance });
    },

    'month': function(month) {
      // 格式化月份显示
      let currentMonth = '本月';
      if (month) {
        const date = new Date(month);
        if (!isNaN(date.getTime())) {
          currentMonth = `${date.getFullYear()}年${date.getMonth() + 1}月`;
        }
      }
      this.setData({ currentMonth });
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 格式化金额显示，确保显示两位小数
    formatAmount(amount) {
      if (amount === undefined || amount === null) return '0.00';
      const n = parseFloat(amount);
      return isNaN(n) ? '0.00' : n.toFixed(2);
    },

    // 显示月份选择器
    showMonthPicker() {
      // 计算当前选中的年月在数组中的索引
      const yearIndex = this.data.years.indexOf(this.data.selectedYear);
      const monthIndex = this.data.selectedMonth - 1; // 月份从1开始，索引从0开始

      this.setData({
        showPicker: true,
        pickerValue: [yearIndex, monthIndex]
      });
    },

    // 隐藏月份选择器
    hideMonthPicker() {
      this.setData({ showPicker: false });
    },

    // 处理选择器变化
    onPickerChange(e) {
      const values = e.detail.value;
      const selectedYear = this.data.years[values[0]];
      const selectedMonth = this.data.months[values[1]];

      this.setData({
        selectedYear,
        selectedMonth,
        pickerValue: values
      });
    },

    // 确认选择
    confirmPicker() {
      const { selectedYear, selectedMonth } = this.data;

      // 更新显示的月份文本
      const currentMonth = `${selectedYear}年${selectedMonth}月`;

      this.setData({
        currentMonth,
        showPicker: false
      });

      // 触发月份变更事件
      this.triggerEvent('monthchange', {
        year: selectedYear,
        month: selectedMonth
      });
    },

    // 防止滚动穿透
    preventTouchMove() {
      return false;
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 初始化年份列表
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = currentYear - 5; i <= currentYear; i++) {
        years.push(i);
      }

      // 设置当前年月
      const now = new Date();
      const currentMonth = now.getMonth() + 1;

      this.setData({
        years,
        selectedYear: currentYear,
        selectedMonth: currentMonth,
        pickerValue: [5, currentMonth - 1] // 默认选中当前年月
      });

      // 如果没有传入月份，则使用当前月份
      if (!this.data.month) {
        const monthStr = `${currentYear}-${currentMonth < 10 ? '0' + currentMonth : currentMonth}`;
        this.setData({ month: monthStr });
      }
    }
  }
})
