Page({
  data:{
    userInfo: null,
    name:'',
    desc:'',
    coverUrl: '', // 封面图URL
    coverFile: null, // 封面图文件
    coverError: '', // 封面图错误信息
    fileId: '' // 上传后的文件ID
  },

  onName(e){ this.setData({ name: e.detail.value }) },

  onDesc(e){ this.setData({ desc: e.detail.value }) },

  onShow(){
    // 获取全局登录状态
    const app = getApp();
    this.setData({
      userInfo: app.globalData.userInfo
    });
  },

  // 选择封面图
  chooseCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        const tempFile = res.tempFiles[0];

        // 检查文件大小限制（2MB）
        const sizeLimit = 2 * 1024 * 1024; // 2MB
        if (tempFile.size > sizeLimit) {
          this.setData({
            coverError: '图片大小不能超过2MB'
          });
          wx.showToast({
            title: '图片大小不能超过2MB',
            icon: 'none'
          });
          return;
        }

        // 检查图片尺寸
        wx.getImageInfo({
          src: tempFile.tempFilePath,
          success: (imgInfo) => {
            // 图片尺寸限制：建议比例1:1，最小尺寸200x200
            if (imgInfo.width < 200 || imgInfo.height < 200) {
              this.setData({
                coverError: '图片尺寸太小，建议至少200x200'
              });
              wx.showToast({
                title: '图片尺寸太小，建议至少200x200',
                icon: 'none'
              });
              return;
            }

            // 保存图片信息
            this.setData({
              coverUrl: tempFile.tempFilePath,
              coverFile: tempFile,
              coverError: ''
            });

            // 上传图片到服务器
            this.uploadCoverImage(tempFile.tempFilePath);
          },
          fail: () => {
            wx.showToast({
              title: '获取图片信息失败',
              icon: 'none'
            });
          }
        });
      }
    });
  },

  // 上传封面图到服务器
  uploadCoverImage(filePath) {
    wx.showLoading({
      title: '上传中...',
      mask: true
    });

    // 获取用户信息
    const { userInfo } = this.data;
    const uploaderId = userInfo && userInfo.userNo ? userInfo.userNo : 'anonymous';

    // 上传文件
    wx.uploadFile({
      url: 'http://localhost:9003/api/files/upload',
      filePath: filePath,
      name: 'file', // 文件对应的 key
      formData: {
        'uploaderId': uploaderId // 上传者ID，如果没有用户信息则使用anonymous
      },
      success: (res) => {
        try {
          // 解析返回的JSON数据
          const data = JSON.parse(res.data);
          console.log("上传成功", data);
          if (data.code === 200 && data.success) {
            // 上传成功，保存文件URL和ID
            this.setData({
              coverUrl: data.data.fileUrl,
              fileId: data.data.id
            });

            wx.showToast({
              title: '上传成功',
              icon: 'success'
            });
          } else {
            // 上传失败
            this.setData({
              coverError: '上传失败：' + (data.message || '未知错误')
            });

            wx.showToast({
              title: '上传失败',
              icon: 'none'
            });
          }
        } catch (e) {
          // JSON解析错误
          this.setData({
            coverError: '上传失败：返回数据格式错误'
          });

          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });

          console.error('上传图片解析返回数据失败:', e, res.data);
        }
      },
      fail: (err) => {
        // 网络错误
        this.setData({
          coverError: '上传失败：网络错误'
        });

        wx.showToast({
          title: '网络错误，请检查服务是否启动',
          icon: 'none'
        });

        console.error('上传图片失败:', err);
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 创建账本
  create(){
    const { name, desc, coverUrl } = this.data;

    // 验证名称
    if(!name){
      wx.showToast({ title:'请输入名称', icon:'none' });
      return;
    }

    // 显示加载中
    wx.showLoading({
      title: '创建中...',
      mask: true
    });

    // 调用后端创建账本接口
    wx.request({
      url: 'http://localhost:9002/ledger/create',
      method: 'POST',
      data: {
        ledgerName: name,
        ledgerDesc: desc,
        ledgerImage: coverUrl || '' 
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        const data = res.data;

        // 请求成功
        if (data && data.code === 200) {
          wx.showToast({
            title: '创建成功',
            icon: 'success'
          });

          // 获取返回的账本编号
          const ledgerNo = data.data?.ledgerNo || String(Date.now());

          // 跳转到账本详情页
          wx.navigateTo({
            url: `/pages/ledgerDetail/detail?ledgerNo=${ledgerNo}`
          });
        } else {
          // 请求失败，显示错误信息
          wx.showToast({
            title: data.message || '创建失败',
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
        console.error('创建账本失败:', err);
      },
      complete: () => {
        // 隐藏加载提示
        wx.hideLoading();
      }
    });
  }
}) 