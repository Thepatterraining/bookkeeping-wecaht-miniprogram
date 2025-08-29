// pages/statistics/statistics.js

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
    bills: []
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