Component({
  properties: {
    ledgerNo: { type: String, value: '' } // 账本编号
  },

  data: {
    loading: false, // 加载中
    error: '', // 错误提示
    bills: [], // 账单数据
    currentYear: new Date().getFullYear(), // 当前选择的年份
    currentMonth: new Date().getMonth() + 1, // 当前选择的月份
    deleteThreshold: -30, // 滑动删除阈值，调整为更容易触发
    activeSwipeIndex: -1, // 当前激活的滑动项索引
    touchStartX: 0, // 触摸开始位置
    // 模拟数据
    mockData: [
      {
        no: '1001',
        categoryName: '餐饮',
        categoryIcon: '🍔',
        amount: 3500, // 35元
        time: '2023-09-15 12:30:00',
        desc: '午餐'
      },
      {
        no: '1002',
        categoryName: '交通',
        categoryIcon: '🚗',
        amount: 1200, // 12元
        time: '2023-09-15 09:15:00',
        desc: '打车上班'
      },
      {
        no: '1003',
        categoryName: '购物',
        categoryIcon: '🛒',
        amount: 25000, // 250元
        time: '2023-09-14 18:45:00',
        desc: '超市购物'
      },
      {
        no: '1004',
        categoryName: '工资',
        categoryIcon: '💰',
        amount: -1000000, // -10000元 (收入为负数)
        time: '2023-09-10 09:00:00',
        desc: '9月工资'
      },
      {
        no: '1005',
        categoryName: '娱乐',
        categoryIcon: '🎬',
        amount: 4500, // 45元
        time: '2023-09-09 20:30:00',
        desc: '电影票'
      },
      {
        no: '1006',
        categoryName: '服饰',
        categoryIcon: '👕',
        amount: 29900, // 299元
        time: '2023-09-08 15:20:00',
        desc: '新衣服'
      },
      {
        no: '1007',
        categoryName: '医疗',
        categoryIcon: '💊',
        amount: 15000, // 150元
        time: '2023-09-07 10:00:00',
        desc: '看医生'
      },
      {
        no: '1008',
        categoryName: '奖金',
        categoryIcon: '🎁',
        amount: -200000, // -2000元 (收入为负数)
        time: '2023-09-05 14:00:00',
        desc: '项目奖金'
      }
    ]
  },

  lifetimes: {
    attached() {
      // 获取账单数据
      this.fetchBills();
    }
  },

  observers: {
    'ledgerNo': function(next) {
      if (next) {
        // 获取账单数据
        this.fetchBills();
      }
    }
  },

  methods: {
    // 使用模拟数据
    useMockData() {
      this.setData({
        loading: true,
        error: ''
      });

      // 模拟网络请求延迟
      setTimeout(() => {
        // 为每个账单项添加slideX属性和transactionType，用于左滑删除和显示收支
        const bills = this.data.mockData.map((item, index) => {
          // 取绝对值用于显示
          const formattedAmount = Math.abs(item.amount);
          // 根据金额判断收支类型：负数为收入（1），正数为支出（2）
          const transactionType = item.amount < 0 ? 1 : 2;
          // 提取日期部分（格式 "2026-02-26"）
          const dateOnly = item.time ? item.time.split(' ')[0] : '';
          // 检查是否需要显示日期头
          let showDateHeader = false;
          if (index === 0) {
            showDateHeader = true; // 第一项总是显示日期头
          }
          return {
            ...item,
            formattedAmount: formattedAmount,
            transactionType: transactionType, // 1=收入，2=支出
            date: dateOnly, // 添加提取后的日期
            showDateHeader: showDateHeader, // 添加是否显示日期头的标记
            slideX: 0 // 初始滑动位置为0
          };
        });

        this.setData({
          bills,
          loading: false
        });
      }, 500);
    },

    // 获取账单列表
    fetchBills() {
      const { ledgerNo, currentYear, currentMonth } = this.data;
      if (!ledgerNo) {
        this.setData({ error: '账本编号不能为空' });
        return;
      }

      this.setData({ loading: true, error: '' });

      wx.request({
        url: 'http://localhost:9002/transactionStatement/list',
        method: 'GET',
        data: {
          page: 1,
          size: 10,
          ledgerNo: ledgerNo
        },
        header: { 'content-type': 'application/json' },
        success: (res) => {
          const resp = res && res.data;
          if (resp && resp.code === 200 && resp.data && Array.isArray(resp.data.list)) {
            // 处理账单数据
            const list = this.processTransactionData(resp.data.list);
            this.setData({ bills: list });
          } else {
            // 如果接口调用失败或返回数据格式不正确，使用模拟数据
            console.warn('获取账单失败，使用模拟数据');
            this.useMockData();
          }
        },
        fail: (err) => {
          console.error('获取账单失败:', err);
          // 网络错误时使用模拟数据
          this.useMockData();
        },
        complete: () => {
          this.setData({ loading: false });
        }
      });
    },

    // 处理交易数据
    processTransactionData(transactions) {
      if (!transactions || transactions.length === 0) {
        return [];
      }

      // 处理每条交易记录，添加默认图标和滑动属性
      return transactions.map((item, index) => {
        // 根据分类名称选择合适的图标
        const icon = this.getCategoryIcon(item.categoryName);

        // 计算格式化后的金额显示
        const amountValue = item.amount || 0;
        // 取绝对值用于显示
        const formattedAmount = Math.abs(amountValue);

        // 提取日期部分（格式 "2026-02-26"）
        const dateOnly = item.time ? item.time.split(' ')[0] : '';
        // 检查是否需要显示日期头
        let showDateHeader = false;
        if (index === 0) {
          showDateHeader = true; // 第一项总是显示日期头
        }

        return {
          no: item.no,
          categoryName: item.categoryName || '未分类',
          categoryIcon: item.categoryIcon || icon,
          amount: amountValue,
          formattedAmount: formattedAmount, // 添加格式化后的金额
          time: item.time || '',
          date: dateOnly, // 添加提取后的日期
          showDateHeader: showDateHeader, // 添加是否显示日期头的标记
          desc: item.desc || '',
          transactionType: item.transactionType || 2, // 1=收入，2=支出，保存分类类型
          slideX: 0 // 初始滑动位置为0
        };
      });
    },

    // 根据分类名称获取图标
    getCategoryIcon(categoryName) {
      if (!categoryName) return '📝';

      const categoryMap = {
        '餐饮': '🍔',
        '午餐': '🍱',
        '晚餐': '🍲',
        '早餐': '🥐',
        '外卖': '🥡',
        '交通': '🚗',
        '购物': '🛒',
        '工资': '💰',
        '娱乐': '🎬',
        '服饰': '👕',
        '医疗': '💊',
        '奖金': '🎁',
        '住房': '🏠',
        '旅行': '✈️',
        '教育': '📚',
        '通讯': '📱',
        '水电': '💡',
        '礼物': '🎀'
      };

      return categoryMap[categoryName] || '📝';
    },


    // 格式化时间显示（月日 时分）
    formatTime(str) {
      if (!str) return '';
      try {
        const date = new Date(str.replace(/-/g, '/'));
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return `${m}-${d} ${hh}:${mm}`;
      } catch(_) {
        return str;
      }
    },

    // 格式化金额显示
    formatAmount(a) {
      if (a === undefined || a === null) return '0.00';
      const n = parseFloat(a);
      return isNaN(n) ? '0.00' : (n / 100).toFixed(2);
    },

    // 触摸开始事件
    handleTouchStart(e) {
      this.setData({
        touchStartX: e.changedTouches[0].clientX
      });
    },

    // 触摸结束事件
    handleTouchEnd(e) {
      const { index } = e.currentTarget.dataset;
      const { bills, activeSwipeIndex } = this.data;
      const touchEndX = e.changedTouches[0].clientX;
      const moveX = touchEndX - this.data.touchStartX;

      // 如果是向左滑动且滑动距离足够大
      if (moveX < -50) {
        // 显示删除按钮
        const updatedBills = [...bills];

        // 如果有其他项目处于激活状态，先重置它
        if (activeSwipeIndex !== -1 && activeSwipeIndex !== index) {
          updatedBills[activeSwipeIndex].slideX = 0;
        }

        // 激活当前项目
        updatedBills[index].slideX = -150;

        this.setData({
          bills: updatedBills,
          activeSwipeIndex: index
        });

        // 添加震动反馈
        wx.vibrateShort({
          type: 'medium'
        });
      } else {
        // 恢复原位
        const updatedBills = [...bills];
        updatedBills[index].slideX = 0;

        this.setData({
          bills: updatedBills,
          activeSwipeIndex: -1
        });
      }
    },

    // 删除账单
    deleteBill(e) {
      const { no } = e.currentTarget.dataset;

      wx.showModal({
        title: '确认删除',
        content: '确定要删除这条账单记录吗？',
        success: (res) => {
          if (res.confirm) {
            // 调用删除接口
            this.deleteTransaction(no);
          } else {
            // 用户取消，恢复所有项目的位置
            this.resetAllItems();
          }
        }
      });
    },

    // 重置所有滑动项
    resetAllItems() {
      const { bills } = this.data;
      const updatedBills = bills.map(item => ({
        ...item,
        slideX: 0
      }));

      this.setData({
        bills: updatedBills,
        activeSwipeIndex: -1
      });
    },

    // 调用删除交易记录接口
    deleteTransaction(no) {
      if (!no) return;

      wx.showLoading({ title: '删除中...' });

      wx.request({
        url: `http://localhost:9002/transactionStatement/delete/${no}`,
        method: 'DELETE',
        data: {
          ledgerNo: this.data.ledgerNo
        },
        header: { 'content-type': 'application/json' },
        success: (res) => {
          const resp = res && res.data;
          if (resp && resp.code === 200) {
            // 删除成功，更新本地数据
            const updatedBills = this.data.bills.filter(item => item.no !== no);
            this.setData({
              bills: updatedBills,
              activeSwipeIndex: -1
            });

            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: resp?.message || '删除失败',
              icon: 'none'
            });
            // 删除失败，重置所有项目
            this.resetAllItems();
          }
        },
        fail: () => {
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          });
          // 网络错误，重置所有项目
          this.resetAllItems();
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    },

    // 点击账单项
    onTapItem(e) {
      const no = e?.currentTarget?.dataset?.no || '';
      this.triggerEvent('itemtap', { no });
    },

    // 更新年月
    updateYearMonth(year, month) {
      this.setData({
        currentYear: year,
        currentMonth: month
      });

      // 重新获取数据
      this.fetchBills();
    }
  }
}) 