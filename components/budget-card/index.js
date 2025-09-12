// components/budget-card/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 总预算金额
    totalBudget: {
      type: Number,
      value: 0
    },
    // 已使用金额
    usedAmount: {
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
    // 可用金额
    availableAmount: 0,
    // 使用比例（百分比）
    usagePercentage: 0,
    // 当前月份显示
    currentMonth: '',
    // 进度条颜色
    progressColor: '#6c72cb'
  },

  /**
   * 数据监听器
   */
  observers: {
    'totalBudget, usedAmount': function(totalBudget, usedAmount) {
      // 计算可用金额
      const availableAmount = Math.max(0, totalBudget - usedAmount);

      // 计算使用比例
      let usagePercentage = 0;
      if (totalBudget > 0) {
        usagePercentage = Math.min(100, Math.round((usedAmount / totalBudget) * 100));
      }

      // 根据使用比例设置进度条颜色
      let progressColor = '#6c72cb'; // 默认蓝紫色
      if (usagePercentage > 80) {
        progressColor = '#e26d89'; // 超过80%显示红色
      } else if (usagePercentage > 60) {
        progressColor = '#ff9800'; // 超过60%显示橙色
      }

      this.setData({
        availableAmount,
        usagePercentage,
        progressColor
      });
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
    // 点击设置预算
    onSetBudget() {
      this.triggerEvent('setbudget');
    },

    // 格式化金额显示
    formatAmount(amount) {
      if (amount === undefined || amount === null) return '0.00';
      const n = parseFloat(amount);
      return isNaN(n) ? '0.00' : n.toFixed(2);
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 如果没有传入月份，则使用当前月份
      if (!this.data.month) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const monthStr = `${year}-${month < 10 ? '0' + month : month}`;
        this.setData({ month: monthStr });
      }
    }
  }
})
