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
    members: [], // 成员列表
    currentUser: null // 当前用户
  },

  // 组件的生命周期
  lifetimes: {
    attached() {
      // 获取当前用户信息
      const app = getApp();
      this.setData({
        currentUser: app.globalData.userInfo
      });

      // 初次加载成员列表
      this.fetchMembers();
    }
  },

  // 属性监听器
  observers: {
    'ledgerNo': function(next) {
      if (next) {
        this.fetchMembers(); // ledgerNo 变化时重新拉取
      }
    }
  },

  // 组件的方法列表
  methods: {
    // 获取成员列表
    fetchMembers() {
      const { ledgerNo } = this.data;
      if (!ledgerNo) {
        this.setData({ error: '账本编号不能为空' });
        return;
      }

      this.setData({ loading: true, error: '' });

      wx.request({
        url: 'http://localhost:9002/ledger/members',
        method: 'GET',
        data: { ledgerNo },
        header: { 'content-type': 'application/json' },
        success: (res) => {
          const d = res && res.data;
          if (d && d.code === 200 && d.data && Array.isArray(d.data.list)) {
            // 处理成员列表数据
            const list = (d.data.list || []).map(it => ({
              userNo: it.userNo,
              userName: it.userName || '未命名用户',
              userAvatar: it.userAvatar || '',
              role: this.formatRole(it.role || 'member'),
              roleType: it.role || 'member',
              joinTime: it.joinTime || ''
            }));

            this.setData({ members: list });
          } else {
            this.setData({ error: '获取成员列表失败' });
          }
        },
        fail: (err) => {
          this.setData({ error: '网络错误，请检查服务是否启动' });
          console.error('获取成员列表失败:', err);
        },
        complete: () => {
          this.setData({ loading: false });
        }
      });
    },

    // 格式化角色名称
    formatRole(role) {
      const roleMap = {
        'owner': '创建者',
        'admin': '管理员',
        'member': '成员'
      };
      return roleMap[role] || '成员';
    },

    // 点击成员
    onTapMember(e) {
      const userNo = e.currentTarget.dataset.userno;
      const member = this.data.members.find(m => m.userNo === userNo);

      if (member) {
        this.triggerEvent('membertap', { member });
      }
    },

    // 显示更多操作
    showMoreActions(e) {
      const userNo = e.currentTarget.dataset.userno;
      const member = this.data.members.find(m => m.userNo === userNo);

      if (member) {
        this.triggerEvent('moreactions', { member });
      }
    }
  }
})
