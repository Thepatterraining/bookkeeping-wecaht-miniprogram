Page({
  data: {
    ledgerNo: '', // 账本编号
    ledgerInfo: null, // 账本信息
    showActionSheet: false, // 是否显示操作菜单
    currentMember: null, // 当前选中的成员
    isOwner: false, // 当前用户是否是创建者
    isAdmin: false // 当前用户是否是管理员
  },

  onLoad(options) {
    const ledgerNo = options.ledgerNo || '';

    if (!ledgerNo) {
      wx.showToast({
        title: '账本编号不能为空',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ ledgerNo });
    this.fetchLedgerInfo();
  },

  // 获取账本信息
  fetchLedgerInfo() {
    const { ledgerNo } = this.data;

    wx.request({
      url: 'http://localhost:9002/ledger/detail',
      method: 'GET',
      data: { ledgerNo },
      header: { 'content-type': 'application/json' },
      success: (res) => {
        const d = res && res.data;
        if (d && d.code === 200 && d.data) {
          this.setData({
            ledgerInfo: d.data,
            isOwner: d.data.isOwner || false,
            isAdmin: d.data.isAdmin || false
          });
        } else {
          wx.showToast({
            title: '获取账本信息失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  // 处理成员点击事件
  handleMemberTap(e) {
    const { member } = e.detail;

    // 如果是创建者或管理员，显示操作菜单
    if (this.data.isOwner || this.data.isAdmin) {
      this.setData({
        currentMember: member,
        showActionSheet: true
      });
    }
  },

  // 处理更多操作点击事件
  handleMoreActions(e) {
    const { member } = e.detail;

    this.setData({
      currentMember: member,
      showActionSheet: true
    });
  },

  // 关闭操作菜单
  closeActionSheet() {
    this.setData({
      showActionSheet: false
    });
  },

  // 设置为管理员
  setAsAdmin() {
    const { currentMember, ledgerNo } = this.data;

    if (!currentMember) return;

    wx.showLoading({
      title: '设置中...',
      mask: true
    });

    wx.request({
      url: 'http://localhost:9002/ledger/setRole',
      method: 'POST',
      data: {
        ledgerNo,
        userNo: currentMember.userNo,
        role: 'admin'
      },
      header: { 'content-type': 'application/json' },
      success: (res) => {
        const d = res && res.data;
        if (d && d.code === 200) {
          wx.showToast({
            title: '设置成功',
            icon: 'success'
          });

          // 刷新成员列表
          this.selectComponent('#memberList').fetchMembers();
        } else {
          wx.showToast({
            title: d.message || '设置失败',
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
        wx.hideLoading();
        this.closeActionSheet();
      }
    });
  },

  // 移除成员
  removeMember() {
    const { currentMember, ledgerNo } = this.data;

    if (!currentMember) return;

    wx.showModal({
      title: '移除成员',
      content: `确定要移除成员"${currentMember.userName}"吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '移除中...',
            mask: true
          });

          wx.request({
            url: 'http://localhost:9002/ledger/removeMember',
            method: 'POST',
            data: {
              ledgerNo,
              userNo: currentMember.userNo
            },
            header: { 'content-type': 'application/json' },
            success: (res) => {
              const d = res && res.data;
              if (d && d.code === 200) {
                wx.showToast({
                  title: '移除成功',
                  icon: 'success'
                });

                // 刷新成员列表
                this.selectComponent('#memberList').fetchMembers();
              } else {
                wx.showToast({
                  title: d.message || '移除失败',
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
              wx.hideLoading();
              this.closeActionSheet();
            }
          });
        }
      }
    });
  }
})
