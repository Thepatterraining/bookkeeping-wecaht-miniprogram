Page({
  data: {
    ledgers: [],
    filtered: [],
    searchQuery: '',
    activeTab: 'all',
    defaultCover: '/assets/images/default-ledger.png',
    showLoginModal: false,
    currentPage: '',
    hasLogin: false,
    showOptionsModal: false, // 控制更多选项弹窗显示
    showInviteModal: false, // 控制邀请成员弹窗显示
    currentLedger: null, // 当前选中的账本
    showJoinModal: false, // 控制加入账本弹窗显示
    joinCode: '' // 加入账本的邀请码
  },
  onLoad() {
    // 记录当前页面路径，用于登录后跳转回来
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    this.setData({
      currentPage: `/${currentPage.route}`
    });

    this.checkLoginStatus();
    this.initAndFetch();
  },
  onShow() {
    // 每次页面显示时，都重新获取登录状态并刷新数据
    const app = getApp();
    const hasLogin = app.globalData.hasLogin;
    const userInfo = app.globalData.userInfo;

    this.setData({
      hasLogin: hasLogin,
      userInfo: userInfo
    });

    // 如果已登录，刷新账本列表
    if (hasLogin) {
      this.fetchLedgers();
    }
  },
  onPullDownRefresh() {
    this.fetchLedgers();
  },
  onSearch(e){
    this.setData({ searchQuery: (e.detail.value || '').trim() });
    this.applyFilter();
  },
  switchTab(e){
    this.setData({ activeTab: e.currentTarget.dataset.tab });
    this.applyFilter();
  },
  applyFilter(){
    const { ledgers, searchQuery, activeTab } = this.data;
    const q = (searchQuery || '').toLowerCase();
    const list = (ledgers || []).filter(function(it){
      const name = String(it.ledgerName || '').toLowerCase();
      const matchQ = !q || name.indexOf(q) >= 0;
      // TODO: 按 activeTab 进一步筛选（当前后端未提供角色字段，先全量）
      const matchTab = true;
      return matchQ && matchTab;
    });
    this.setData({ filtered: list });
  },
  initAndFetch(){
    const start = Date.now();
    const maxWaitMs = 1000;
    if (wx.__requestWrapped__) {
      this.fetchLedgers();
      return;
    }
    const intervalId = setInterval(() => {
      if (wx.__requestWrapped__ || Date.now() - start > maxWaitMs) {
        clearInterval(intervalId);
        this.fetchLedgers();
      }
    }, 50);
  },
  fetchLedgers() {
    const that = this;

    // 检查登录状态
    const app = getApp();
    const hasLogin = app.globalData.hasLogin;

    this.setData({
      hasLogin: hasLogin
    });

    if (!hasLogin) {
      // 未登录状态，显示一些默认数据或提示登录
      that.setData({
        ledgers: [],
        filtered: []
      });
      return;
    }

    wx.request({
      url: 'http://localhost:9002/ledger/list',
      method: 'GET',
      data: { page: 1, size: 10 },
      header: { 'content-type': 'application/json', 'X-userID': '7356238086801457152' },
      success(res) {
        const resp = res && res.data;
        if (resp && resp.code === 200 && resp.data && Array.isArray(resp.data.list)) {
          const list = (resp.data.list || []).map(function(it){
            // 处理角色信息
            let role = it.role || '成员';
            let roleType = 'member';

            if (role === '创建者' || role === '管理员') {
              roleType = role === '创建者' ? 'owner' : 'admin';
            }

            return {
              ledgerNo: it.ledgerNo,
              ledgerName: it.ledgerName || '未命名账本',
              ledgerDesc: it.ledgerDesc || '',
              ledgerImage: it.ledgerImage || '',
              role: role, // 角色名称
              roleType: roleType // 角色类型
            };
          });
          that.setData({ ledgers: list }, function(){ that.applyFilter(); });
        } else {
          wx.showToast({ title: '获取账本失败', icon: 'none' });
        }
      },
      fail() {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete() {
        wx.stopPullDownRefresh();
      }
    });
  },
  goDetail(e) {
    // 检查登录状态
    const app = getApp();
    if (!app.globalData.hasLogin) {
      this.showLogin();
      return;
    }

    const ledgerNo = e.currentTarget.dataset.no;
    wx.navigateTo({ url: `/pages/ledgerDetail/detail?ledgerNo=${ledgerNo}` });
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp();
    if (!app.globalData.hasLogin) {
      // 可以在这里决定是否自动弹出登录框
      // this.showLogin();
    }
  },

  // 显示登录弹窗
  showLogin() {
    this.setData({
      showLoginModal: true
    });
  },

  // 关闭登录弹窗
  closeLogin() {
    this.setData({
      showLoginModal: false
    });
  },

  // 登录成功回调
  onLoginSuccess(e) {
    this.setData({
      showLoginModal: false
    });

    // 刷新数据
    this.fetchLedgers();
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

  // 显示更多选项弹窗
  showMoreOptions(e) {
    const ledger = e.currentTarget.dataset.ledger;
    this.setData({
      showOptionsModal: true,
      currentLedger: ledger
    });
  },

  // 隐藏更多选项弹窗
  hideMoreOptions() {
    this.setData({
      showOptionsModal: false
    });
  },

  // 显示邀请成员弹窗
  showInviteModal() {
    // 获取当前账本信息
    const { currentLedger } = this.data;

    // 显示加载中
    wx.showLoading({
      title: '获取邀请码...',
      mask: true
    });

    // 调用后端接口获取最新邀请码
    wx.request({
      url: 'http://localhost:9002/invitation/getLatestCode',
      method: 'GET',
      data: {
        ledgerNo: currentLedger.ledgerNo
      },
      success: (res) => {
        const data = res.data;

        // 请求成功
        if (data && data.code === 200 && data.success) {
          // 更新邀请码
          currentLedger.inviteCode = data.data;
          this.setData({ currentLedger });

          // 隐藏更多选项弹窗，显示邀请弹窗
          this.setData({
            showOptionsModal: false,
            showInviteModal: true
          });
        } else {
          // 请求失败，显示错误信息
          wx.showToast({
            title: data.message || '获取邀请码失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        // 网络错误
        wx.showToast({
          title: '网络错误，请检查服务是否启动',
          icon: 'none'
        });
        console.error('获取邀请码失败:', err);
      },
      complete: () => {
        // 隐藏加载提示
        wx.hideLoading();
      }
    });
  },

  // 隐藏邀请成员弹窗
  hideInviteModal() {
    this.setData({
      showInviteModal: false
    });
  },

  // 复制邀请码
  copyInviteCode() {
    const { currentLedger } = this.data;
    wx.setClipboardData({
      data: currentLedger.inviteCode,
      success: () => {
        wx.showToast({
          title: '邀请码已复制',
          icon: 'success'
        });
      }
    });
  },

  // 显示加入账本弹窗
  showJoinModal() {
    // 检查登录状态
    const app = getApp();
    if (!app.globalData.hasLogin) {
      this.showLogin();
      return;
    }

    this.setData({
      showJoinModal: true,
      joinCode: ''
    });
  },

  // 隐藏加入账本弹窗
  hideJoinModal() {
    this.setData({
      showJoinModal: false
    });
  },

  // 监听邀请码输入
  onJoinCodeInput(e) {
    this.setData({
      joinCode: e.detail.value
    });
  },

  // 加入账本
  joinLedger() {
    const { joinCode } = this.data;

    if (!joinCode || joinCode.trim() === '') {
      wx.showToast({
        title: '请输入邀请码',
        icon: 'none'
      });
      return;
    }

    // 显示加载中
    wx.showLoading({
      title: '加入中...',
      mask: true
    });

    // 调用后端接口加入账本
    wx.request({
      url: 'http://localhost:9002/ledger/join',
      method: 'POST',
      data: {
        invitationCode: joinCode
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        const data = res.data;

        if (data && data.code === 200) {
          wx.showToast({
            title: '加入成功',
            icon: 'success'
          });

          // 隐藏弹窗
          this.hideJoinModal();

          // 刷新账本列表
          this.fetchLedgers();

          // 如果返回了账本编号，可以直接跳转到账本详情页
          if (data.data && data.data.ledgerNo) {
            wx.navigateTo({
              url: `/pages/ledgerDetail/detail?ledgerNo=${data.data.ledgerNo}`
            });
          }
        } else {
          wx.showToast({
            title: data.message || '加入失败，请检查邀请码是否正确',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络错误，请检查服务是否启动',
          icon: 'none'
        });
        console.error('加入账本失败:', err);
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 防止滚动穿透
  preventTouchMove() {
    return false;
  },

  // 处理图片加载错误
  handleImageError(e) {
    // 获取当前项的索引
    const index = e.currentTarget.dataset.index;
    // 修改对应项的图片为默认图片
    const key = `filtered[${index}].ledgerImage`;
    this.setData({
      [key]: this.data.defaultCover
    });
  },

  // 显示删除确认对话框
  showDeleteConfirm() {
    const { currentLedger } = this.data;

    if (!currentLedger) return;

    wx.showModal({
      title: '删除账本',
      content: `确定要删除账本"${currentLedger.ledgerName}"吗？删除后无法恢复。`,
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.deleteLedger();
        } else {
          this.hideMoreOptions();
        }
      }
    });
  },

  // 删除账本
  deleteLedger() {
    const { currentLedger } = this.data;

    if (!currentLedger) return;

    // 显示加载中
    wx.showLoading({
      title: '删除中...',
      mask: true
    });

    // 调用后端接口删除账本
    wx.request({
      url: 'http://localhost:9002/ledger/delete',
      method: 'POST',
      data: {
        ledgerNo: currentLedger.ledgerNo
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        const data = res.data;

        if (data && data.code === 200) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });

          // 从本地数据中移除该账本
          this.removeLedgerFromList(currentLedger.ledgerNo);
        } else {
          wx.showToast({
            title: data.message || '删除失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络错误，请检查服务是否启动',
          icon: 'none'
        });
        console.error('删除账本失败:', err);
      },
      complete: () => {
        wx.hideLoading();
        this.hideMoreOptions();
      }
    });
  },

  // 从列表中移除账本
  removeLedgerFromList(ledgerNo) {
    if (!ledgerNo) return;

    const { ledgers, filtered } = this.data;

    // 从原始账本列表中移除
    const newLedgers = ledgers.filter(item => item.ledgerNo !== ledgerNo);

    // 从筛选后的列表中移除
    const newFiltered = filtered.filter(item => item.ledgerNo !== ledgerNo);

    this.setData({
      ledgers: newLedgers,
      filtered: newFiltered
    });
  },

  // 跳转到创建账本页面
  goToCreateLedger() {
    // 检查登录状态
    const app = getApp();
    if (!app.globalData.hasLogin) {
      this.showLogin();
      return;
    }

    // 跳转到创建账本页面
    wx.navigateTo({
      url: '/pages/createLedger/index'
    });
  },

}) 