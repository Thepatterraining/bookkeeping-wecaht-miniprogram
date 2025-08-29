Component({
  properties: {
    show: { type: Boolean, value: false }, // 是否显示弹层
    selectedCategory: { type: String, value: '' }, // 当前选中的分类名
    selectedCategoryNo: { type: String, value: '' } // 当前选中的分类编号
  },

  data: {
    type: 'expense', // expense 或 income
    searchQuery: '', // 搜索关键字
    recentCategories: [], // 最近使用
    categories: { expense: [], income: [] }, // 分类数据
    filteredExpense: [], // 过滤后的支出分类
    filteredIncome: [] // 过滤后的收入分类
  },

  lifetimes: {
    attached() {
      this.fetchCategories() // 组件挂载后拉取分类
    }
  },

  methods: {
    // 拉取分类数据（后端接口）
    fetchCategories() {
      const that = this
      wx.request({
        url: 'http://localhost:9002/category/all/list',
        method: 'GET',
        data: { page: 1, size: 10 },
        header: { 'content-type': 'application/json' },
        success(res) {
          const d = res && res.data
          if (d && d.code === 200 && d.data && Array.isArray(d.data.list)) {
            const list = d.data.list || []
            // 接口返回的是全部分类（以支出为主），组件按现有 UI 显示为 expense 列表
            const expense = list
            const income = []
            that.setData({ categories: { expense, income } })
          } else {
            wx.showToast({ title: '获取分类失败', icon: 'none' })
          }
        },
        fail() {
          wx.showToast({ title: '网络错误', icon: 'none' })
        }
      })
    },

    onSearchInput(e) {
      const queryRaw = (e.detail.value || '')
      const query = queryRaw.trim().toLowerCase()
      const { categories } = this.data
      if (!query) {
        this.setData({ searchQuery: '', filteredExpense: [], filteredIncome: [] })
        return
      }
      const fuzzyFilterTree = (items) => {
        if (!Array.isArray(items)) return []
        return items.map(parent => {
          const name = (parent.categoryName || '').toLowerCase()
          const parentMatch = name.includes(query)
          const children = Array.isArray(parent.subCategoryList) ? parent.subCategoryList : []
          const matchedChildren = children.filter(child => ((child.categoryName || '').toLowerCase()).includes(query))
          if (parentMatch) {
            return Object.assign({}, parent) // 父类命中则保留整个父项
          }
          if (matchedChildren.length > 0) {
            return Object.assign({}, parent, { subCategoryList: matchedChildren }) // 仅保留命中的子项
          }
          return null
        }).filter(Boolean)
      }
      const filteredExpense = fuzzyFilterTree(categories.expense)
      const filteredIncome = fuzzyFilterTree(categories.income)
      this.setData({ searchQuery: queryRaw, filteredExpense, filteredIncome })
    },

    onSetType(e) {
      const nextType = e?.currentTarget?.dataset?.type || 'expense'
      this.setData({ type: nextType, searchQuery: '', filteredExpense: [], filteredIncome: [] })
    },

    onPickCategory(e) {
      const name = e?.currentTarget?.dataset?.category || ''
      const no = e?.currentTarget?.dataset?.no || ''
      this.triggerEvent('select', { name, no })
      // 维护最近使用
      const { recentCategories } = this.data
      const exists = recentCategories.some(c => c.no === no)
      const next = exists ? recentCategories : [{ name, no }, ...recentCategories].slice(0, 8)
      this.setData({ recentCategories: next })
      this.onClose()
    },

    onClose() {
      this.setData({ searchQuery: '', filteredExpense: [], filteredIncome: [] })
      this.triggerEvent('close')
    }
  }
}) 