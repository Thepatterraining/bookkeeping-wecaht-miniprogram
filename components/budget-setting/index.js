Component({
  // 组件的属性列表
  properties: {
    ledgerNo: {
      type: String,
      value: '' // 账本编号
    },
    show: {
      type: Boolean,
      value: false // 是否显示预算设置弹窗
    }
  },

  // 组件的初始数据
  data: {
    budgetAmount: '', // 预算金额
    budgetDate: '', // 预算日期
    displayDate: '', // 显示用的日期文案
    showDatePicker: false, // 日期选择器显示状态
    submitting: false // 提交中标记，防重复点击
  },

  // 组件的生命周期
  lifetimes: {
    attached() {
      // 初始化当前月份
      this.initCurrentMonth();
    }
  },

  // 属性监听器
  observers: {
    'show': function(next) {
      if (next) {
        // 显示弹窗时重新初始化当前月份
        this.initCurrentMonth();
      }
    }
  },

  // 组件的方法列表
  methods: {
    // 初始化当前月份
    initCurrentMonth() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const budgetDate = `${year}-${month}-01`; // 预算日期设为当月1号

      this.setData({
        budgetDate,
        displayDate: this.formatDisplayDate(budgetDate)
      });
    },

    // 格式化显示日期
    formatDisplayDate(date) {
      if (!date) return '';
      try {
        const [y, m] = date.split('-');
        return `${y}年${m}月`;
      } catch (_) {
        return date;
      }
    },

    // 输入预算金额
    onAmountInput(e) {
      let value = e.detail.value;

      // 只保留数字，移除所有非数字字符
      value = value.replace(/\D/g, '');

      // 移除前导零
      value = value.replace(/^0+/, '');

      // 如果清空了，允许为空字符串
      if (value === '') {
        this.setData({ budgetAmount: '' });
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

      this.setData({ budgetAmount: value });
    },

    // 打开日期选择器
    openDatePicker() {
      this.setData({ showDatePicker: true });
    },

    // 关闭日期选择器
    closeDatePicker() {
      this.setData({ showDatePicker: false });
    },

    // 日期选择确认
    onDateChange(e) {
      const selectedDate = e.detail.value;
      // 将选择的日期转换为当月1号
      const [year, month] = selectedDate.split('-');
      const budgetDate = `${year}-${month}-01`;

      this.setData({
        budgetDate,
        displayDate: this.formatDisplayDate(budgetDate),
        showDatePicker: false
      });
    },

    // 提交预算设置
    submitBudget() {
      if (this.data.submitting) return; // 防止重复点击

      const { budgetAmount, budgetDate, ledgerNo } = this.data;

      // 验证输入
      if (!budgetAmount) {
        wx.showToast({ title: '请输入预算金额', icon: 'none' });
        return;
      }

      if (!budgetDate) {
        wx.showToast({ title: '请选择预算月份', icon: 'none' });
        return;
      }

      if (!ledgerNo) {
        wx.showToast({ title: '账本编号不能为空', icon: 'none' });
        return;
      }

      // 验证金额格式
      const amount = parseInt(budgetAmount, 10);
      if (isNaN(amount) || amount <= 0) {
        wx.showToast({ title: '请输入有效的预算金额', icon: 'none' });
        return;
      }

      // 验证金额上限（小于10000000）
      if (amount >= 10000000) {
        wx.showToast({ title: '预算金额不能超过9999999', icon: 'none' });
        return;
      }

      this.setData({ submitting: true });

      // 调用设置预算接口
      wx.request({
        url: 'http://localhost:9002/ledger/update/budget',
        method: 'POST',
        data: {
          ledgerNo: ledgerNo,
          budgetDate: budgetDate,
          budgetAmount: budgetAmount
        },
        header: { 'content-type': 'application/json' },
        success: (res) => {
          const resp = res && res.data;
          if (resp && resp.code === 200) {
            wx.showToast({
              title: '预算设置成功',
              icon: 'success'
            });

            // 通知父组件预算设置成功
            this.triggerEvent('budgetset', {
              budgetAmount: amount,
              budgetDate: budgetDate
            });

            // 关闭弹窗
            this.closeBudgetSetting();
          } else {
            wx.showToast({
              title: resp?.message || '设置失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          });
        },
        complete: () => {
          this.setData({ submitting: false });
        }
      });
    },

    // 关闭预算设置弹窗
    closeBudgetSetting() {
      this.setData({
        budgetAmount: '',
        showDatePicker: false
      });
      this.triggerEvent('close');
    },

    // 阻止事件冒泡
    preventBubble() {
      // 空方法，用于阻止事件冒泡
    }
  }
})
