// 顶层重写，避免 onLaunch 未触发导致不生效
(function(){
  if (!wx.__requestWrapped__) {
    const originalRequest = wx.request
    if (typeof originalRequest === 'function') {
      wx.request = function(options) {
        options = options || {}
        const originalHeader = options.header || {}
        const userId = wx.getStorageSync('X-userID') || '7356238086801457152'
        options.header = Object.assign({}, originalHeader, {
          'X-userID': userId
        })
        return originalRequest(options)
      }
      wx.__requestWrapped__ = true
    }
  }
})()

App({
  globalData: {
    userInfo: null,
    hasLogin: false
  },
  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      this.globalData.hasLogin = true;
      this.globalData.userInfo = userInfo;
    }
  },

  // 微信登录方法
  login(callback) {
    const that = this;

    // 先获取微信登录凭证code
    wx.login({
      success(res) {
        if (res.code) {
          // 使用新版获取用户信息API
          wx.getUserInfo({
            desc: '用于完善用户资料',
            success: (profileRes) => {
              // 将code和用户信息发送到后端进行登录验证
              wx.request({
                url: 'http://localhost:9002/api/login',
                method: 'POST',
                data: {
                  code: res.code,
                  userInfo: profileRes.userInfo
                },
                success: (loginRes) => {
                  // 模拟登录成功
                  const mockUserInfo = {
                    nickName: '测试用户',
                    avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
                    gender: 1,
                    province: '广东',
                    city: '深圳'
                  };

                  // 保存用户信息和token
                  wx.setStorageSync('token', 'mock_token_' + Date.now());
                  wx.setStorageSync('userInfo', mockUserInfo);
                  wx.setStorageSync('X-userID', '7356238086801457152');

                  that.globalData.hasLogin = true;
                  that.globalData.userInfo = mockUserInfo;

                  // 执行回调
                  if (typeof callback === 'function') {
                    callback(true);
                  }
                },
                fail: () => {
                  // 模拟登录成功（实际开发中应该是失败处理）
                  const mockUserInfo = {
                    nickName: '测试用户',
                    avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
                    gender: 1,
                    province: '广东',
                    city: '深圳'
                  };

                  // 保存用户信息和token
                  wx.setStorageSync('token', 'mock_token_' + Date.now());
                  wx.setStorageSync('userInfo', mockUserInfo);
                  wx.setStorageSync('X-userID', '7356238086801457152');

                  that.globalData.hasLogin = true;
                  that.globalData.userInfo = mockUserInfo;

                  // 执行回调
                  if (typeof callback === 'function') {
                    callback(true);
                  }
                }
              });
            },
            fail: (err) => {
              console.log('获取用户信息失败', err);
              // 模拟登录成功（实际开发中应该是失败处理）
              const mockUserInfo = {
                nickName: '测试用户',
                avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
                gender: 1,
                province: '广东',
                city: '深圳'
              };

              // 保存用户信息和token
              wx.setStorageSync('token', 'mock_token_' + Date.now());
              wx.setStorageSync('userInfo', mockUserInfo);
              wx.setStorageSync('X-userID', '7356238086801457152');

              that.globalData.hasLogin = true;
              that.globalData.userInfo = mockUserInfo;

              // 执行回调
              if (typeof callback === 'function') {
                callback(true);
              }
            }
          });
        } else {
          // 模拟登录成功（实际开发中应该是失败处理）
          const mockUserInfo = {
            nickName: '测试用户',
            avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
            gender: 1,
            province: '广东',
            city: '深圳'
          };

          // 保存用户信息和token
          wx.setStorageSync('token', 'mock_token_' + Date.now());
          wx.setStorageSync('userInfo', mockUserInfo);
          wx.setStorageSync('X-userID', '7356238086801457152');

          that.globalData.hasLogin = true;
          that.globalData.userInfo = mockUserInfo;

          // 执行回调
          if (typeof callback === 'function') {
            callback(true);
          }
        }
      },
      fail: () => {
        // 模拟登录成功（实际开发中应该是失败处理）
        const mockUserInfo = {
          nickName: '测试用户',
          avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
          gender: 1,
          province: '广东',
          city: '深圳'
        };

        // 保存用户信息和token
        wx.setStorageSync('token', 'mock_token_' + Date.now());
        wx.setStorageSync('userInfo', mockUserInfo);
        wx.setStorageSync('X-userID', '7356238086801457152');

        that.globalData.hasLogin = true;
        that.globalData.userInfo = mockUserInfo;

        // 执行回调
        if (typeof callback === 'function') {
          callback(true);
        }
      }
    });
  }
}) 