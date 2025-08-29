Page({
  data:{
    userInfo: null,
    hasLogin: false,
    currentPage: '',
    showLoginModal: false
  },

  onLoad(options) {
    // 记录当前页面路径，用于登录后跳转回来
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    this.setData({
      currentPage: `/${currentPage.route}`
    });
  },

  onShow(){
    // 获取全局登录状态
    const app = getApp();
    this.setData({
      hasLogin: app.globalData.hasLogin,
      userInfo: app.globalData.userInfo
    });
  },

  // 登录按钮点击事件
  handleLogin() {
    this.setData({
      showLoginModal: true
    });
  },

  // 退出登录
  handleLogout() {
    const app = getApp();

    // 清除登录信息
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');

    app.globalData.hasLogin = false;
    app.globalData.userInfo = null;

    this.setData({
      hasLogin: false,
      userInfo: null
    });

    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    });
  },

  // 登录成功回调
  onLoginSuccess(e) {
    this.setData({
      showLoginModal: false,
      hasLogin: true,
      userInfo: e.detail.userInfo
    });
  },

  // 登录失败回调
  onLoginFail() {
    this.setData({
      showLoginModal: false
    });

    wx.showToast({
      title: '登录失败，请重试',
      icon: 'none'
    });
  },

  // 关闭登录弹窗
  closeLogin() {
    this.setData({
      showLoginModal: false
    });
  }
}) 