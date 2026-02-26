// pages/categoryManagement/index.js
Page({
  data: {
    // 分类数据，分为支出和收入两种类型
    categories: {
      expense: [], // 支出分类
      income: []   // 收入分类
    },
    // 当前激活的标签：expense-支出，income-收入
    activeTab: 'expense',
    // 是否显示添加分类弹窗
    showAddModal: false,
    // 新分类信息
    newCategory: {
      // 分类名称
      name: '',
      // 分类图标
      icon: '📝',
      // 分类类型：expense-支出，income-收入
      type: 'expense',
      // 是否为一级分类（false则为二级分类）
      isParent: true,
      // 父分类编号（仅当为二级分类时使用，用于创建二级分类时作为parentNo）
      parentNo: null
    },
    // 可选的图标列表
    icons: ['📝', '🍔', '🍕', '🚗', '🏠', '👕', '💊', '📱', '💻', '🎮', '🎬', '📚', '🎓', '💼', '💰', '💸', '🧾', '🛒', '🏦', '🎁'],
    // 显示添加二级分类模式（用于区分是否在添加二级分类）
    addingSubCategory: false,
    // 选中的父分类编号（用于添加二级分类时保存父分类的categoryNo）
    selectedParentNo: null,
    // 一级分类的展开状态，使用categoryNo作为键
    expandedCategories: {}
  },

  // 页面加载时调用
  onLoad() {
    // 输出日志：页面已加载
    console.log('分类管理页面已加载');
    // 调用获取分类列表的方法
    this.fetchCategories();
  },

  // 页面显示时调用（每次页面显示都会调用，包括从其他页面返回）
  onShow() {
    // 输出日志：页面显示
    console.log('分类管理页面已显示，刷新分类列表');
    // 每次进入该页面时，都重新获取分类列表以确保数据最新
    this.fetchCategories();
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
  },

  // 获取分类列表
  fetchCategories() {
    // 输出日志：开始获取分类
    console.log('开始获取分类列表');
    // 并行调用两个接口：获取支出分类和收入分类
    Promise.all([
      this.fetchCategoryByType(1), // 1代表支出分类
      this.fetchCategoryByType(2)  // 2代表收入分类
    ]).then(([expenseData, incomeData]) => {
      // 输出日志：成功获取分类数据
      console.log('成功获取分类数据:', { expenseData, incomeData });
      // 处理支出分类数据
      const expenseCategories = this.processCategories(expenseData.list);
      // 处理收入分类数据
      const incomeCategories = this.processCategories(incomeData.list);

      // 输出日志：处理后的分类数据
      console.log('处理后的分类数据:', { expenseCategories, incomeCategories });

      // 更新页面数据
      this.setData({
        'categories.expense': expenseCategories,
        'categories.income': incomeCategories
      });
    }).catch((error) => {
      // 输出错误日志
      console.error('获取分类数据失败:', error);
      // 显示错误提示
      wx.showToast({
        title: '获取分类失败',
        icon: 'none'
      });
    });
  },

  // 根据类型获取分类数据
  // 参数：categoryType - 分类类型，1=支出分类，2=收入分类
  fetchCategoryByType(categoryType) {
    // 输出日志：开始请求分类数据
    console.log(`开始请求categoryType=${categoryType}的分类数据`);
    
    return new Promise((resolve, reject) => {
      wx.request({
        // API端点地址
        url: 'http://localhost:9002/category/user/list',
        // 请求方法
        method: 'GET',
        // 请求参数
        data: {
          // 分类类型参数
          categoryType: categoryType // 1=支出分类，2=收入分类
        },
        // 请求头
        header: { 'content-type': 'application/json' },
        // 成功回调
        success: (res) => {
          // 获取响应数据
          const resp = res && res.data;
          // 输出日志：收到响应
          console.log(`categoryType=${categoryType}的响应数据:`, resp);
          
          // 判断响应是否成功
          if (resp && resp.code === 200 && resp.data) {
            // 返回原始数据，由processCategories处理
            console.log(`categoryType=${categoryType}的分类数据处理成功`);
            resolve(resp.data);
          } else {
            // 响应失败
            console.error(`categoryType=${categoryType}的响应不正确:`, resp);
            reject(new Error(resp?.message || '获取分类数据失败'));
          }
        },
        // 请求失败回调
        fail: (err) => {
          // 输出错误日志
          console.error(`获取categoryType=${categoryType}分类失败:`, err);
          reject(err);
        }
      });
    });
  },

  // 处理分类数据，将一级和二级分类转换为扁平结构
  processCategories(data) {
    // 输出日志：处理的原始数据
    console.log('processCategories 收到的原始数据:', data);
    
    // 如果数据为空或未定义，返回空数组
    if (!data) return [];
    
    // 如果data是数组，开始处理
    if (Array.isArray(data)) {
      // 用于存储处理结果的数组
      const result = [];
      // 遍历每个一级分类
      data.forEach((item, index) => {
        // 输出日志：处理的每个一级分类
        console.log(`处理第${index}个分类项:`, item);
        
        // 将categoryType数值转换为字符串类型（1=expense, 2=income）
        const categoryTypeString = item.categoryType === 1 ? 'expense' : 'income';
        
        // 添加一级分类（检查必要字段是否存在）
        if (item.categoryName && item.categoryType !== undefined) {
          result.push({
            // 分类ID
            id: item.categoryId || item.id,
            // 分类编号（用于作为parentNo添加二级分类时使用）
            categoryNo: item.categoryNo,
            // 分类名称
            name: item.categoryName,
            // 分类图标，默认为'📝'
            icon: item.categoryIcon || '📝',
            // 分类类型转换为字符串格式（expense 或 income），用于与WXML中的data-type匹配
            type: categoryTypeString,
            // 标记为一级分类
            isParent: true,
            // 默认展开状态（所有一级分类默认展开）
            isExpanded: true
          });
          // 输出日志：一级分类添加成功
          console.log(`一级分类添加成功: ${item.categoryName}，类型: ${categoryTypeString}`);
        }
        
        // 处理二级分类（如果存在）
        if (item.subCategoryList && Array.isArray(item.subCategoryList)) {
          // 输出日志：发现二级分类
          console.log(`${item.categoryName}有${item.subCategoryList.length}个二级分类:`, item.subCategoryList);
          
          // 遍历每个二级分类
          item.subCategoryList.forEach(child => {
            result.push({
              // 二级分类ID
              id: child.categoryId || child.id,
              // 二级分类编号
              categoryNo: child.categoryNo,
              // 二级分类名称（不需要添加空格前缀，缩进由CSS实现）
              name: child.categoryName,
              // 二级分类图标，默认为'📝'
              icon: child.categoryIcon || '📝',
              // 二级分类类型转换为字符串格式（继承自一级分类，expense 或 income）
              type: categoryTypeString,
              // 记录父分类ID（用于添加二级分类时的验证）
              parentId: item.categoryId || item.id,
              // 记录父分类的categoryNo（用于展开/收起时判断二级分类是否需要显示）
              parentCategoryNo: item.categoryNo,
              // 标记为二级分类
              isParent: false,
              // 记录父分类的展开状态（初始值与一级分类相同，默认为true）
              parentExpanded: true
            });
            // 输出日志：二级分类添加成功
            console.log(`二级分类添加成功: ${child.categoryName}，类型: ${categoryTypeString}`);
          });
        }
      });
      // 返回处理后的分类列表
      console.log('processCategories 处理后的最终数据:', result);
      return result;
    }
    
    // 如果数据不是数组，返回空数组
    console.warn('processCategories 收到非数组数据:', data);
    return [];
  },

  // 显示添加分类弹窗
  // 参数：e - 事件对象，包含 data-is-sub 和 data-parent-no
  showAddCategoryModal(e) {
    // 从事件对象的dataset中获取是否为二级分类的标记
    const isSub = e.currentTarget.dataset.isSub === 'true' || e.currentTarget.dataset.isSub === true;
    // 从事件对象的dataset中获取父分类的categoryNo
    const parentNo = e.currentTarget.dataset.parentNo;
    // 输出日志：显示添加分类弹窗
    console.log('showAddCategoryModal 被调用:', { isSub, parentNo });

    this.setData({
      // 显示弹窗
      showAddModal: true,
      // 设置当前分类类型为激活的标签
      'newCategory.type': this.data.activeTab,
      // 设置是否为一级分类（true=一级，false=二级）
      'newCategory.isParent': !isSub,
      // 如果添加二级分类，设置父分类的categoryNo
      'newCategory.parentNo': isSub ? parentNo : null,
      // 记录是否处于添加二级分类模式
      addingSubCategory: isSub || false,
      // 保存选中的父分类categoryNo
      selectedParentNo: isSub ? parentNo : null
    });
  },

  // 隐藏添加分类弹窗
  hideAddCategoryModal() {
    this.setData({
      // 隐藏弹窗
      showAddModal: false,
      // 清空分类名称
      'newCategory.name': '',
      // 重置图标为默认值
      'newCategory.icon': '📝',
      // 重置为一级分类
      'newCategory.isParent': true,
      // 清空父分类categoryNo
      'newCategory.parentNo': null,
      // 清空添加二级分类标记
      addingSubCategory: false,
      // 清空选中的父分类categoryNo
      selectedParentNo: null
    });
  },

  // 输入新分类名称
  onCategoryNameInput(e) {
    this.setData({
      'newCategory.name': e.detail.value
    });
  },

  // 选择图标
  selectIcon(e) {
    const icon = e.currentTarget.dataset.icon;
    this.setData({
      'newCategory.icon': icon
    });
  },

  // 添加新分类
  addCategory() {
    // 获取新分类的信息
    const { name, icon, type, isParent, parentNo } = this.data.newCategory;
    // 输出日志：添加分类的参数
    console.log('addCategory 方法被调用:', { name, icon, type, isParent, parentNo });

    // 验证分类名称不为空
    if (!name.trim()) {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      });
      return;
    }

    // 显示加载中提示
    wx.showLoading({
      title: '添加中...',
      mask: true
    });

    // 构建API请求数据
    const requestData = {
      // 分类级别：1=一级分类，2=二级分类
      categoryLevel: isParent ? 1 : 2,
      // 分类名称
      categoryName: name.trim(),
      // 分类图标
      categoryIcon: icon,
      // 分类类型：1=支出，2=收入
      categoryType: type === 'expense' ? 1 : 2,
      // 交易类型说明（对应categoryType，1=支出，2=收入，作为transactionDesc）
      transactionDesc: type === 'expense' ? '支出' : '收入'
    };

    // 如果是二级分类，直接添加父分类的categoryNo作为parentNo
    if (!isParent && parentNo) {
      // 输出日志：二级分类添加parentNo
      console.log(`添加二级分类，parentNo=${parentNo}`);
      // 直接使用传入的parentNo
      requestData.parentNo = parentNo;
    } else {
      // 输出日志：不是二级分类或没有parentNo
      console.log('不需要添加parentNo，isParent=' + isParent + ', parentNo=' + parentNo);
    }
    
    // 输出最终的请求数据
    console.log('最终发送的请求数据:', requestData);

    // 调用接口添加分类
    wx.request({
      // API端点地址
      url: 'http://localhost:9002/category/user/create',
      // 请求方法
      method: 'POST',
      // 请求数据
      data: requestData,
      // 请求头
      header: { 'content-type': 'application/json' },
      // 成功回调
      success: (res) => {
        // 获取响应数据
        const resp = res && res.data;
        // 判断API返回是否成功
        if (resp && resp.code === 200) {
          // 显示添加成功提示
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          });

          // 隐藏弹窗并重置表单
          this.hideAddCategoryModal();

          // 重新获取分类列表以确保数据同步（包括一级和二级分类的完整结构）
          this.fetchCategories();
        } else {
          // API返回错误信息
          wx.showToast({
            title: resp?.message || '添加失败',
            icon: 'none'
          });
        }
      },
      // 请求失败回调
      fail: (err) => {
        // 输出错误日志
        console.error('添加分类失败:', err);
        // 显示网络错误提示
        wx.showToast({
          title: '网络错误，请检查服务是否启动',
          icon: 'none'
        });
      },
      // 请求完成回调（无论成功或失败）
      complete: () => {
        // 隐藏加载提示
        wx.hideLoading();
      }
    });
  },

  // 删除分类
  deleteCategory(e) {
    // 获取删除操作的分类categoryNo和类型
    const { categoryNo, type } = e.currentTarget.dataset;
    // 输出日志：删除分类请求
    console.log('删除分类请求:', { categoryNo, type, currentData: this.data.categories });

    wx.showModal({
      title: '删除分类',
      content: '确定要删除该分类吗？',
      success: (res) => {
        if (res.confirm) {
          // 显示加载中
          wx.showLoading({
            title: '删除中...',
            mask: true
          });

          // 调用删除接口
          wx.request({
            url: 'http://localhost:9002/category/delete',
            method: 'POST',
            data: {
              // 使用categoryNo作为标识
              categoryNo: categoryNo
            },
            header: { 'content-type': 'application/json' },
            success: (res) => {
              const resp = res && res.data;
              if (resp && resp.code === 200) {
                // 删除成功，从本地列表中移除
                // 防御性检查：确保分类类型有效且数据存在
                if (!type || !this.data.categories[type]) {
                  // 输出警告日志：分类类型无效或不存在
                  console.warn(`分类类型无效或不存在, type=${type}`);
                  return;
                }
                // 使用categoryNo过滤而不是id
                const updatedCategories = this.data.categories[type].filter(item => item.categoryNo !== categoryNo);

                this.setData({
                  [`categories.${type}`]: updatedCategories
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
              }
            },
            fail: (err) => {
              console.error('删除分类失败:', err);
              wx.showToast({
                title: '网络错误，请检查服务是否启动',
                icon: 'none'
              });
            },
            complete: () => {
              wx.hideLoading();
            }
          });
        }
      }
    });
  },

  // 编辑分类（跳转到编辑页面）
  editCategory(e) {
    // 获取分类的categoryNo和类型
    const { categoryNo, type } = e.currentTarget.dataset;
    // 输出日志：编辑分类请求
    console.log('编辑分类请求:', { categoryNo, type });
    
    // 防御性检查：确保分类类型有效且数据存在
    if (!type || !this.data.categories[type]) {
      // 输出警告日志：分类类型无效或不存在
      console.warn(`分类类型无效或不存在, type=${type}`);
      return;
    }
    
    // 根据categoryNo查找分类
    const category = this.data.categories[type].find(item => item.categoryNo === categoryNo);

    if (category) {
      // 这里可以跳转到编辑页面，或者直接在当前页面编辑
      // 当前暂未实现编辑功能，可在后续完善
      wx.showToast({
        title: '编辑功能开发中',
        icon: 'none'
      });
    }
  },

  // 切换一级分类的展开/收起状态
  toggleCategoryExpand(e) {
    // 获取一级分类的categoryNo
    const { categoryNo } = e.currentTarget.dataset;
    // 输出日志：切换展开状态
    console.log('切换展开状态:', { categoryNo });

    // 获取当前激活的标签类型
    const categoryType = this.data.activeTab;
    // 获取该标签下的所有分类
    const categories = this.data.categories[categoryType];
    
    // 防御性检查：如果分类数组不存在或为空，直接返回
    if (!categories || !Array.isArray(categories)) {
      // 输出警告日志：分类数据不存在或为空
      console.warn(`分类数据不存在或为空, categoryType=${categoryType}，categories=`, categories);
      return;
    }
    
    // 首先找到该一级分类，并获取其新的展开状态
    let newExpandedState = false;
    for (let item of categories) {
      // 检查item是否存在和有效
      if (item && item.isParent && item.categoryNo === categoryNo) {
        newExpandedState = !item.isExpanded;
        break;
      }
    }
    
    // 遍历分类列表，更新对应一级分类的展开状态，以及该一级分类下所有二级分类的parentExpanded状态
    const updatedCategories = categories.map(item => {
      // 如果是一级分类且categoryNo匹配，则切换其展开状态
      if (item.isParent && item.categoryNo === categoryNo) {
        // 反转展开状态
        return {
          ...item,
          isExpanded: !item.isExpanded
        };
      }
      // 如果是二级分类，且其父分类的categoryNo匹配，则更新其parentExpanded状态
      if (!item.isParent && item.parentCategoryNo === categoryNo) {
        return {
          ...item,
          parentExpanded: newExpandedState
        };
      }
      return item;
    });

    // 输出日志：更新后的分类列表
    console.log('更新后的分类列表:', updatedCategories);

    // 更新数据
    this.setData({
      [`categories.${categoryType}`]: updatedCategories
    });
  },

  // 防止滚动穿透
  preventTouchMove() {
    return false;
  }
});
