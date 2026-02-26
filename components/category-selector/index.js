Component({
  properties: {
    show: { type: Boolean, value: false }, // 是否显示弹层
    selectedCategory: { type: String, value: '' }, // 当前选中的分类名
    selectedCategoryNo: { type: String, value: '' }, // 当前选中的分类编号
    defaultType: { type: String, value: 'expense' } // 默认显示的分类类型 (expense/income)
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

  observers: {
    // 当 show 属性改变时，重置选中的类型为 defaultType
    show(newVal) {
      if (newVal) {
        // 弹层打开时，设置类型为传入的 defaultType
        this.setData({ type: this.properties.defaultType || 'expense' })
      }
    }
  },

  methods: {
    // 拉取分类数据（后端接口）
    // 根据 categoryType 获取对应的分类：1 = 支出分类，2 = 收入分类
    fetchCategories() {
      const that = this
      // 定义获取单个分类类型的函数
      const fetchCategoryType = (categoryType, categoryName) => {
        return new Promise((resolve) => {
          wx.request({
            url: 'http://localhost:9002/category/all/list',
            method: 'GET',
            data: { page: 1, size: 100, categoryType }, // 传递 categoryType 参数
            header: { 'content-type': 'application/json' },
            success(res) {
              const d = res && res.data
              if (d && d.code === 200 && d.data && Array.isArray(d.data.list)) {
                resolve(d.data.list || [])
              } else {
                resolve([])
              }
            },
            fail() {
              resolve([]) // 失败时返回空数组
            }
          })
        })
      }
      
      // 并行获取支出和收入分类
      Promise.all([
        fetchCategoryType(1, '支出'), // 1 代表支出分类
        fetchCategoryType(2, '收入') // 2 代表收入分类
      ]).then(([expenseList, incomeList]) => {
        // 获取分类成功，更新组件数据
        that.setData({ 
          categories: { 
            expense: expenseList,
            income: incomeList 
          } 
        })
      }).catch(() => {
        // 获取分类失败提示
        wx.showToast({ title: '获取分类失败', icon: 'none' })
      })
    },

    onSearchInput(e) {
      const queryRaw = (e.detail.value || '')
      const query = queryRaw.trim().toLowerCase()
      const { categories, type } = this.data
      if (!query) {
        this.setData({ searchQuery: '', filteredExpense: [], filteredIncome: [] })
        return
      }
      // 模糊搜索树形结构的分类
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
      // 只对当前类型的分类进行搜索
      const filteredList = fuzzyFilterTree(categories[type] || [])
      if (type === 'expense') {
        this.setData({ searchQuery: queryRaw, filteredExpense: filteredList, filteredIncome: [] })
      } else {
        this.setData({ searchQuery: queryRaw, filteredExpense: [], filteredIncome: filteredList })
      }
    },

    onPickCategory(e) {
      const name = e?.currentTarget?.dataset?.category || ''
      const no = e?.currentTarget?.dataset?.no || ''
      // 获取完整的分类对象，用于传递 type 字段
      const categoryType = e?.currentTarget?.dataset?.type || (this.data.type === 'expense' ? 1 : 2)
      // 触发 select 事件，通知父组件用户已选择分类
      this.triggerEvent('select', { name, no, categoryType })
      // 维护最近使用的分类列表
      const { recentCategories } = this.data
      const exists = recentCategories.some(c => c.no === no) // 检查是否已在最近使用列表中
      const next = exists ? recentCategories : [{ name, no, categoryType }, ...recentCategories].slice(0, 8) // 新分类入栈并限制长度为8
      this.setData({ recentCategories: next }) // 更新最近使用列表
      // 清除搜索和过滤，并触发 close 事件通知父组件关闭分类选择器
      this.setData({ searchQuery: '', filteredExpense: [], filteredIncome: [] })
      this.triggerEvent('close')
    },

    // 点击蒙层或关闭按钮时关闭分类选择器
    maskClose() {
      // 清除搜索和过滤
      this.setData({ searchQuery: '', filteredExpense: [], filteredIncome: [] })
      // 触发 close 事件通知父组件关闭分类选择器
      this.triggerEvent('close')
    }
  }
}) 