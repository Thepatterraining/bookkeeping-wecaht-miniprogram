Component({
  properties: {
    // 是否显示登录弹窗
    show: {
      type: Boolean,
      value: false
    },
    // 登录成功后的回调页面路径
    callbackPage: {
      type: String,
      value: ''
    }
  },

  data: {
    loading: false,
    loginType: 'phone', // 登录类型：phone-手机号验证码登录，account-账号密码登录，wechat-微信登录
    step: 'userInfo', // 微信登录步骤：userInfo-获取用户信息，phoneNumber-获取手机号

    // 手机号验证码登录
    phone: '',
    verifyCode: '',
    countDown: 0,
    codeSending: false,

    // 账号密码登录
    username: '',
    password: '',

    // 微信登录
    tempUserInfo: null, // 临时存储用户信息
    tempCode: '' // 临时存储登录凭证
  },

  observers: {
    'show': function(show) {
      // 当弹窗显示时，重置状态
      if (show) {
        console.log('登录弹窗显示，重置状态');
        this.setData({
          loginType: 'phone', // 默认显示手机号登录
          step: 'userInfo',
          tempUserInfo: null,
          tempCode: '',
          loading: false,
          phone: '',
          verifyCode: '',
          username: '',
          password: '',
          countDown: 0,
          codeSending: false
        });
      }
    }
  },

  methods: {
    // 切换登录类型
    switchLoginType(e) {
      const type = e.currentTarget.dataset.type;
      this.setData({
        loginType: type
      });
    },

    // ==================== 手机号验证码登录 ====================
    // 手机号输入
    onPhoneInput(e) {
      this.setData({
        phone: e.detail.value
      });
    },

    // 验证码输入
    onCodeInput(e) {
      this.setData({
        verifyCode: e.detail.value
      });
    },

    // 发送验证码
    sendVerifyCode() {
      const phone = this.data.phone;

      // 验证手机号
      if (!phone || !/^1\d{10}$/.test(phone)) {
        wx.showToast({
          title: '请输入正确的手机号',
          icon: 'none'
        });
        return;
      }

      this.setData({
        codeSending: true
      });

      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      });
      this.setData({
        codeSending: false
      });

      // 模拟发送成功，开始倒计时
      this.startCountDown();

      // 发送验证码请求
      // wx.request({
      //   url: 'http://localhost:9001/user/sendVerifyCode',
      //   method: 'POST',
      //   data: {
      //     phone: phone
      //   },
      //   success: (res) => {
      //     if (res.data && res.data.code === 0) {
      //       wx.showToast({
      //         title: '验证码已发送',
      //         icon: 'success'
      //       });

      //       // 开始倒计时
      //       this.startCountDown();
      //     } else {
      //       wx.showToast({
      //         title: (res.data && res.data.msg) || '发送失败，请重试',
      //         icon: 'none'
      //       });
      //     }
      //   },
      //   fail: () => {
      //     wx.showToast({
      //       title: '发送失败，请重试',
      //       icon: 'none'
      //     });
      //   },
      //   complete: () => {
      //     this.setData({
      //       codeSending: false
      //     });

      //     // 模拟发送成功，开始倒计时
      //     this.startCountDown();
      //   }
      // });
    },

    // 开始倒计时
    startCountDown() {
      this.setData({
        countDown: 60
      });

      const timer = setInterval(() => {
        if (this.data.countDown <= 1) {
          clearInterval(timer);
          this.setData({
            countDown: 0
          });
        } else {
          this.setData({
            countDown: this.data.countDown - 1
          });
        }
      }, 1000);
    },

    // 手机号登录
    phoneLogin() {
      const { phone, verifyCode } = this.data;

      // 验证手机号和验证码
      if (!phone || !/^1\d{10}$/.test(phone)) {
        wx.showToast({
          title: '请输入正确的手机号',
          icon: 'none'
        });
        return;
      }

      if (!verifyCode || verifyCode.length !== 6) {
        wx.showToast({
          title: '请输入6位验证码',
          icon: 'none'
        });
        return;
      }

      this.setData({
        loading: true
      });

      // 发送登录请求
      wx.request({
        url: 'http://localhost:9001/user/login/mobile',
        method: 'POST',
        data: {
          mobile: phone,
          code: verifyCode
        },
        success: (res) => {
          if (res.data && res.data.code === 200) {
            this.loginSuccess(res.data.data);
          } else {
            wx.showToast({
              title: (res.data && res.data.msg) || '登录失败，请重试',
              icon: 'none'
            });
          }
        },
        fail: () => {
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        },
        complete: () => {
          this.setData({
            loading: false
          });

          // 模拟登录成功
          // this.mockLoginSuccess();
        }
      });
    },

    // ==================== 账号密码登录 ====================
    // 用户名输入
    onUsernameInput(e) {
      this.setData({
        username: e.detail.value
      });
    },

    // 密码输入
    onPasswordInput(e) {
      this.setData({
        password: e.detail.value
      });
    },

    // 账号登录
    accountLogin() {
      const { username, password } = this.data;

      // 验证用户名和密码
      if (!username) {
        wx.showToast({
          title: '请输入用户名',
          icon: 'none'
        });
        return;
      }

      if (!password) {
        wx.showToast({
          title: '请输入密码',
          icon: 'none'
        });
        return;
      }

      this.setData({
        loading: true
      });

      // 发送登录请求
      wx.request({
        url: 'http://localhost:9001/user/login/account',
        method: 'POST',
        data: {
          username: username,
          password: password
        },
        success: (res) => {
          if (res.data && res.data.code === 0) {
            this.loginSuccess(res.data.data);
          } else {
            wx.showToast({
              title: (res.data && res.data.msg) || '登录失败，请重试',
              icon: 'none'
            });
          }
        },
        fail: () => {
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        },
        complete: () => {
          this.setData({
            loading: false
          });

          // 模拟登录成功
          this.mockLoginSuccess();
        }
      });
    },

    // ==================== 微信登录 ====================
    // 获取用户信息
    getUserProfileInfo() {
      const that = this;
      console.log('开始获取用户信息');

      this.setData({
        loading: true
      });

      // 获取用户信息
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success(profileRes) {
          console.log('获取用户信息成功:', profileRes);
          // 获取登录凭证
          wx.login({
            success(loginRes) {
              console.log('获取登录凭证成功:', loginRes);
              if (loginRes.code) {
                // 保存用户信息和登录凭证
                that.setData({
                  tempUserInfo: profileRes.userInfo,
                  tempCode: loginRes.code,
                  step: 'phoneNumber', // 进入下一步：获取手机号
                  loading: false
                });
                console.log('进入获取手机号步骤，当前状态:', that.data);
              } else {
                that.setData({ loading: false });
                wx.showToast({
                  title: '登录失败，请稍后重试',
                  icon: 'none'
                });
                that.triggerEvent('loginfail');
              }
            },
            fail(err) {
              console.log('获取登录凭证失败', err);
              that.setData({ loading: false });
              wx.showToast({
                title: '登录失败，请稍后重试',
                icon: 'none'
              });
              that.triggerEvent('loginfail');
            }
          });
        },
        fail(err) {
          console.log('获取用户信息失败', err);
          that.setData({ loading: false });
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
          that.triggerEvent('loginfail');
        }
      });
    },

    // 获取手机号
    getPhoneNumber(e) {
      const that = this;
      console.log('获取手机号回调触发，结果:', e.detail);

      this.setData({
        loading: true
      });

      // 处理各种错误情况
      if (e.detail.errMsg.indexOf('fail') !== -1) {
        console.log('获取手机号失败:', e.detail.errMsg);

        // 特殊处理无权限错误
        if (e.detail.errMsg === 'getPhoneNumber:fail no permission') {
          console.log('小程序未认证或未申请手机号权限，使用模拟登录');
          // 直接模拟登录成功
          this.mockLoginSuccess(this.data.tempUserInfo);
          return;
        }

        // 用户拒绝授权
        if (e.detail.errMsg === 'getPhoneNumber:fail user deny') {
          console.log('用户拒绝授权手机号');
          this.setData({
            loading: false,
            step: 'userInfo' // 返回第一步
          });
          wx.showToast({
            title: '您已拒绝授权手机号',
            icon: 'none'
          });
          this.triggerEvent('loginfail');
          return;
        }

        // 其他错误情况，也模拟登录成功
        console.log('获取手机号遇到其他错误，使用模拟登录');
        this.mockLoginSuccess(this.data.tempUserInfo);
        return;
      }

      if (e.detail.errMsg === 'getPhoneNumber:ok') {
        console.log('用户同意授权手机号，当前状态:', this.data);
        // 确保有code和用户信息
        if (!this.data.tempCode) {
          console.log('没有临时code，重新获取');
          // 如果没有code，重新获取
          wx.login({
            success(loginRes) {
              console.log('重新获取登录凭证成功:', loginRes);
              if (loginRes.code) {
                // 将code、手机号加密数据和用户信息发送到后端
                that.sendLoginRequest(loginRes.code, e.detail, that.data.tempUserInfo);
              } else {
                that.setData({ loading: false });
                wx.showToast({
                  title: '登录失败，请稍后重试',
                  icon: 'none'
                });
                that.triggerEvent('loginfail');
              }
            },
            fail(err) {
              console.log('获取登录凭证失败', err);
              // 模拟登录成功
              that.mockLoginSuccess(that.data.tempUserInfo);
            }
          });
        } else {
          console.log('使用已有临时code:', this.data.tempCode);
          // 将code、手机号加密数据和用户信息发送到后端
          that.sendLoginRequest(that.data.tempCode, e.detail, that.data.tempUserInfo);
        }
      } else {
        console.log('用户拒绝授权手机号或发生其他错误');
        // 模拟登录成功
        this.mockLoginSuccess(this.data.tempUserInfo);
      }
    },

    // 发送微信登录请求到后端
    sendLoginRequest(code, phoneData, userInfo) {
      const that = this;
      const app = getApp();

      console.log('准备发送登录请求，参数:', {
        code: code,
        phoneData: phoneData,
        userInfo: userInfo
      });

      // 测试环境，直接模拟登录成功
      if (true) {
        this.mockLoginSuccess(userInfo);
        return;
      }

      // 发送请求到后端
      wx.request({
        url: 'http://localhost:9001/user/login/wechat',
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        data: {
          code: code,
          mobile: phoneData, // 手机号加密数据
          wechatUserInfo: userInfo // 微信用户信息
        },
        success(res) {
          console.log('登录接口返回:', res);
          that.setData({ loading: false });

          if (res.data && res.data.code === 0) {
            // 登录成功
            that.loginSuccess(res.data.data);
          } else {
            // 登录失败
            wx.showToast({
              title: (res.data && res.data.msg) || '登录失败，请重试',
              icon: 'none'
            });
            that.triggerEvent('loginfail');
          }
        },
        fail(err) {
          console.log('登录请求失败', err);
          // 模拟登录成功
          that.mockLoginSuccess(userInfo);
        }
      });
    },

    // ==================== 通用方法 ====================
    // 登录成功处理
    loginSuccess(userData) {
      console.log('登录成功', userData);
      const app = getApp();
      const userInfo = userData ? userData : null;

      // 保存用户信息和token
      wx.setStorageSync('token', userData && userData.token ? userData.token : ('mock_token_' + Date.now()));
      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('X-userID', userData && userData.userNo ? userData.userNo : '');

      app.globalData.hasLogin = true;
      app.globalData.userInfo = userInfo;

      // 触发登录成功事件，让父页面处理后续逻辑
      this.triggerEvent('loginsuccess', {
        userInfo: userInfo
      });
    },

    // 模拟登录成功
    mockLoginSuccess(userInfo) {
      const mockUserInfo = userInfo || {
        nickName: '测试用户',
        avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        gender: 1,
        province: '广东',
        city: '深圳'
      };

      const mockData = {
        token: 'mock_token_' + Date.now(),
        userId: '7356238086801457152',
        userInfo: mockUserInfo
      };

      this.loginSuccess(mockData);
    },

    // 关闭登录弹窗
    handleClose() {
      this.triggerEvent('close');
    }
  }
})
