// pages/index/index.js

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentMonth: new Date().getMonth() + 1,
    ledgerNo: '',
    totalIncome: '0.00',
    totalExpense: '0.00'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const ledgerNo = options && options.ledgerNo ? options.ledgerNo : ''
    this.setData({ ledgerNo })
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

  },



  formatDate(date) {
    const d = new Date(date)
    const month = d.getMonth() + 1
    const day = d.getDate()
    return `${month}月${day}日`
  },

  getDailyExpense(bills) {
    return bills
      .filter(bill => bill.type === 'expense')
      .reduce((sum, bill) => sum + bill.amount, 0)
      .toFixed(2)
  },

  getIconClass(category) {
    const iconMap = {
      '餐饮': 'icon-food',
      '交通': 'icon-transport',
      '购物': 'icon-shopping',
      '工资': 'icon-salary'
    }
    return iconMap[category] || 'icon-other'
  },

  showBillDetail(e) {
    const bill = e.currentTarget.dataset.bill
    console.log('显示账单详情:', bill)
    // TODO: 实现账单详情展示
  }
})