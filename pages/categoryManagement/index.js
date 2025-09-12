// pages/categoryManagement/index.js
Page({
  data: {
    categories: {
      expense: [], // 支出分类
      income: []   // 收入分类
    },
    activeTab: 'expense', // 当前激活的标签：expense-支出，income-收入
    showAddModal: false,  // 是否显示添加分类弹窗
    newCategory: {        // 新分类信息
      name: '',
      icon: '📝',
      type: 'expense'
    },
    icons: ['📝', '🍔', '🍕', '🚗', '🏠', '👕', '💊', '📱', '💻', '🎮', '🎬', '📚', '🎓', '💼', '💰', '💸', '🧾', '🛒', '🏦', '🎁']
  },

  onLoad() {
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
    // 模拟数据，实际应从服务器获取
    const expenseCategories = [
      { id: 1, name: '餐饮', icon: '🍔' },
      { id: 2, name: '交通', icon: '🚗' },
      { id: 3, name: '住房', icon: '🏠' },
      { id: 4, name: '服饰', icon: '👕' },
      { id: 5, name: '医疗', icon: '💊' }
    ];

    const incomeCategories = [
      { id: 101, name: '工资', icon: '💰' },
      { id: 102, name: '奖金', icon: '💸' },
      { id: 103, name: '理财', icon: '🏦' },
      { id: 104, name: '礼金', icon: '🎁' }
    ];

    this.setData({
      'categories.expense': expenseCategories,
      'categories.income': incomeCategories
    });
  },

  // 显示添加分类弹窗
  showAddCategoryModal() {
    this.setData({
      showAddModal: true,
      'newCategory.type': this.data.activeTab
    });
  },

  // 隐藏添加分类弹窗
  hideAddCategoryModal() {
    this.setData({
      showAddModal: false,
      'newCategory.name': '',
      'newCategory.icon': '📝'
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
    const { name, icon, type } = this.data.newCategory;

    if (!name.trim()) {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      });
      return;
    }

    // 模拟添加分类，实际应调用服务器API
    const newId = Date.now();
    const newCategory = {
      id: newId,
      name: name.trim(),
      icon: icon
    };

    const categoryType = `categories.${type}`;
    const updatedCategories = [...this.data[categoryType], newCategory];

    this.setData({
      [categoryType]: updatedCategories
    });

    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });

    this.hideAddCategoryModal();
  },

  // 删除分类
  deleteCategory(e) {
    const { id, type } = e.currentTarget.dataset;

    wx.showModal({
      title: '删除分类',
      content: '确定要删除该分类吗？',
      success: (res) => {
        if (res.confirm) {
          // 模拟删除分类，实际应调用服务器API
          const categoryType = `categories.${type}`;
          const updatedCategories = this.data[categoryType].filter(item => item.id !== id);

          this.setData({
            [categoryType]: updatedCategories
          });

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 编辑分类（跳转到编辑页面）
  editCategory(e) {
    const { id, type } = e.currentTarget.dataset;
    const category = this.data[`categories.${type}`].find(item => item.id === id);

    if (category) {
      // 这里可以跳转到编辑页面，或者直接在当前页面编辑
      wx.showToast({
        title: '编辑功能开发中',
        icon: 'none'
      });
    }
  }
});
