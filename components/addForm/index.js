Component({
  properties: {
    ledgerNo: {
      type: String,
      value: ''
    }
  },

  data: {
    type: 'expense',
    amount: '',
    selectedCategory: '',
    selectedCategoryNo: '',
    date: '',
    displayDate: '', // 显示用的日期文案
    isRecurring: false,
    recurringTypes: [
      { value: 'daily', label: '每天' },
      { value: 'weekly', label: '每周' },
      { value: 'monthly', label: '每月' }
    ],
    recurringTypeIndex: 0,
    remark: '',

    showCategoryPopup: false,
    showDatePicker: false, // 日期选择器显示状态
    searchQuery: '',

    recentCategories: [],

    categories: {
      expense: [
        { categoryNo: 'e-food', categoryName: '餐饮' },
        { categoryNo: 'e-traffic', categoryName: '出行' },
        { categoryNo: 'e-ent', categoryName: '娱乐' },
        { categoryNo: 'e-other', categoryName: '其他' }
      ],
      income: [
        { categoryNo: 'i-salary', categoryName: '工资' },
        { categoryNo: 'i-bonus', categoryName: '奖金' },
        { categoryNo: 'i-other', categoryName: '其他' }
      ]
    },

    filteredExpense: [],
    filteredIncome: [],

    submitting: false // 提交中标记，防重复点击
  },

  lifetimes: {
    attached() {
      if (!this.data.date) {
        const now = new Date() // 当前时间
        const yyyy = now.getFullYear() // 年
        const mm = String(now.getMonth() + 1).padStart(2, '0') // 月，补零
        const dd = String(now.getDate()).padStart(2, '0') // 日，补零
        const dateStr = `${yyyy}-${mm}-${dd}` // 组装日期字符串
        this.setData({ date: dateStr, displayDate: this.formatDisplayDate(dateStr) }) // 初始化日期与显示文案
      } else {
        this.setData({ displayDate: this.formatDisplayDate(this.data.date) }) // 已有日期则仅同步显示文案
      }
    }
  },

  methods: {
    setType(e) {
      const nextType = e?.currentTarget?.dataset?.type || 'expense'
      this.setData({ type: nextType })
    },

    onAmountInput(e) {
      this.setData({ amount: e.detail.value })
    },

    openCategoryPopup() {
      this.setData({ showCategoryPopup: true })
    },

    closeCategoryPopup() {
      this.setData({ showCategoryPopup: false, searchQuery: '', filteredExpense: [], filteredIncome: [] })
    },

    // 打开日期选择器
    openDatePicker() {
      this.setData({ showDatePicker: true });
    },

    // 关闭日期选择器
    closeDatePicker() {
      this.setData({ showDatePicker: false });
    },

    // 日期确认选择
    onDateConfirm(e) {
      const picked = e.detail.date // 选择器返回的日期
      this.setData({
        date: picked, // 保存原始日期
        displayDate: this.formatDisplayDate(picked), // 同步显示用文案
        showDatePicker: false // 关闭选择器
      })
    },

    onDateChange(e) {
      const picked = e.detail.value // 原生 picker 的值
      this.setData({ date: picked, displayDate: this.formatDisplayDate(picked) }) // 同步日期与显示文案
    },

    formatDisplayDate(date) {
      if (!date) return '' // 空值保护
      try {
        const [y, m, d] = date.split('-') // 拆分年月日
        return `${y}年${m}月${d}日` // 格式化为中文展示
      } catch (_) {
        return date // 兜底返回原字符串
      }
    },

    // 新增：根据循环类型计算下一次日期（支持 daily/weekly/monthly）
    calculateNextDate(currentDate, recurringType) {
      const date = new Date(currentDate)
      switch (recurringType) {
        case 'daily':
          date.setDate(date.getDate() + 1)
          break
        case 'weekly':
          date.setDate(date.getDate() + 7)
          break
        case 'monthly':
          date.setMonth(date.getMonth() + 1)
          break
        default:
          break
      }
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    },

    toggleRecurring(e) {
      this.setData({ isRecurring: !!e.detail.value })
    },

    onRecurringTypeChange(e) {
      const index = Number(e.detail.value) || 0
      this.setData({ recurringTypeIndex: index })
    },

    onRemarkInput(e) {
      this.setData({ remark: e.detail.value })
    },

    onSearchInput(e) {
      const query = (e.detail.value || '').trim()
      const { categories } = this.data
      const keep = (list) => list.filter(item => item.categoryName.includes(query))
      this.setData({
        searchQuery: query,
        filteredExpense: query ? keep(categories.expense) : [],
        filteredIncome: query ? keep(categories.income) : []
      })
    },

    setCategory(e) {
      const name = e?.currentTarget?.dataset?.category || ''
      const no = e?.currentTarget?.dataset?.no || ''
      this.setData({ selectedCategory: name, selectedCategoryNo: no })
      // 最近使用简单入栈，去重
      const { recentCategories } = this.data
      const exists = recentCategories.some(c => c.no === no)
      const next = exists ? recentCategories : [{ name, no }, ...recentCategories].slice(0, 8)
      this.setData({ recentCategories: next })
      this.closeCategoryPopup()
    },

    onCategorySelected(e) {
      const { name, no } = e.detail || {}
      this.setData({ selectedCategory: name || '', selectedCategoryNo: no || '' })
      this.closeCategoryPopup()
    },

    submitBill() {
      if (this.data.submitting) { return } // 防止重复点击
      const { amount, selectedCategory, selectedCategoryNo, type, remark, date, isRecurring, recurringTypes, recurringTypeIndex, ledgerNo } = this.data

      if (!amount) {
        wx.showToast({ title: '请输入金额', icon: 'none' })
        return
      }
      if (!selectedCategory) {
        wx.showToast({ title: '请选择分类', icon: 'none' })
        return
      }
      if (!selectedCategoryNo) {
        wx.showToast({ title: '分类编号缺失', icon: 'none' })
        return
      }

      this.setData({ submitting: true }) // 标记提交中

      const bills = []
      const currentBill = {
        amount: Number(amount),
        type,
        category: selectedCategory,
        categoryNo: selectedCategoryNo,
        remark,
        date
      }
      bills.push(currentBill)

      if (isRecurring) {
        const recur = recurringTypes[recurringTypeIndex]?.value || 'monthly'
        let nextDate = this.calculateNextDate(date, recur)
        const endDate = new Date()
        endDate.setFullYear(endDate.getFullYear() + 1)
        while (new Date(nextDate) <= endDate) {
          bills.push(Object.assign({}, currentBill, { date: nextDate }))
          nextDate = this.calculateNextDate(nextDate, recur)
        }
      }

      const baseUrl = 'http://localhost:9002/transactionStatement/create'
      let successCount = 0
      let failCount = 0
      const total = bills.length

      bills.forEach((bill) => {
        const payload = {
          categoryNo: bill.categoryNo,
          categoryType: 1,
          transactionType: bill.type === 'expense' ? 2 : 1,
          transactionDesc: remark || '',
          ledgerNo: ledgerNo,
          amount: bill.amount
        }
        wx.request({
          url: baseUrl,
          method: 'POST',
          data: payload,
          header: { 'content-type': 'application/json' },
          success: (res) => {
            const d = res && res.data
            if (d && d.code === 200) {
              successCount++
            } else {
              failCount++
            }
          },
          fail: () => {
            failCount++
          },
          complete: () => {
            if (successCount + failCount === total) {
              const allOk = failCount === 0
              wx.showToast({
                title: allOk ? '保存成功' : `部分失败(${failCount})`,
                icon: allOk ? 'success' : 'none',
                duration: 1200
              })
              if (allOk) {
                setTimeout(() => {
                  // 成功后跳转到账单页面（修改为账单列表页面）
                  // 切换到账单标签页
                  const pages = getCurrentPages()
                  const currentPage = pages[pages.length - 1]
                  if (currentPage && currentPage.route.includes('ledgerDetail')) {
                    // 如果当前在账本详情页，直接切换标签
                    currentPage.setData({ tab: 'bill' })
                  } else {
                    // 否则跳转到账本详情页的账单标签
                    const to = `/pages/ledgerDetail/detail?ledgerNo=${encodeURIComponent(ledgerNo || '')}&tab=bill`
                    wx.navigateTo({ url: to })
                  }
                }, 400)
              }
              // 重置表单
              this.setData({
                amount: '',
                selectedCategory: '',
                selectedCategoryNo: '',
                remark: '',
                isRecurring: false,
                recurringTypeIndex: 0,
                submitting: false // 清除提交中标记
              })
              // 通知父组件
              this.triggerEvent('saved', payload)
            }
          }
        })
      })
    }
  }
}) 