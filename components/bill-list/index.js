Component({
  properties: {
    ledgerNo: { type: String, value: '' } // 账本编号
  },

  data: {
    loading: false, // 加载中
    error: '', // 错误提示
    bills: [], // 账单数据
    currentYear: new Date().getFullYear(), // 当前选择的年份
    currentMonth: new Date().getMonth() + 1 // 当前选择的月份
  },

  lifetimes: {
    attached() {
      this.fetchBills() // 初次加载
    }
  },

  observers: {
    'ledgerNo': function(next) {
      if (next) { this.fetchBills() } // ledgerNo 变化时重新拉取
    }
  },

  methods: {
    fetchBills() {
      const { ledgerNo, currentYear, currentMonth } = this.data
      if (!ledgerNo) {
        this.setData({ error: '账本编号不能为空' })
        return
      }

      this.setData({ loading: true, error: '' })

      wx.request({
        url: 'http://localhost:9002/transactionStatement/list',
        method: 'GET',
        data: {
          page: 1,
          size: 10,
          ledgerNo,
          year: currentYear,
          month: currentMonth
        },
        header: { 'content-type': 'application/json' },
        success: (res) => {
          const d = res && res.data
          if (d && d.code === 200 && d.data && Array.isArray(d.data.list)) {
            const list = (d.data.list || []).map(it => ({
              no: it.no,
              categoryName: it.categoryName || '未分类',
              amount: it.amount || 0,
              time: it.time || '',
              desc: it.desc || '',
              categoryIcon: it.categoryIcon || ''
            }))
            this.setData({ bills: list })
          } else {
            this.setData({ error: '获取账单失败' })
          }
        },
        fail: (err) => {
          this.setData({ error: '网络错误，请检查服务是否启动' })
          console.error('获取账单失败:', err)
        },
        complete: () => {
          this.setData({ loading: false })
        }
      })
    },

    formatTime(str) {
      if (!str) return ''
      try {
        const date = new Date(str.replace(/-/g, '/'))
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        const hh = String(date.getHours()).padStart(2, '0')
        const mm = String(date.getMinutes()).padStart(2, '0')
        return `${m}-${d} ${hh}:${mm}`
      } catch(_) {
        return str
      }
    },

    formatAmount(a) {
      const n = Number(a || 0) / 100 // 将分转换为元
      return n.toFixed(2) // 保留两位小数
    },

    onTapItem(e) {
      const no = e?.currentTarget?.dataset?.no || ''
      this.triggerEvent('itemtap', { no })
    },

    // 处理汇总数据更新
    onSummaryUpdate(e) {
      const { year, month } = e.detail

      // 更新当前选择的年月
      this.setData({
        currentYear: year,
        currentMonth: month
      })

      // 重新获取账单列表
      this.fetchBills()
    }
  }
}) 