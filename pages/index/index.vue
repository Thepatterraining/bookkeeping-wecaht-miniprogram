<template>
  <view class="container">
    <!-- 顶部统计卡片 -->
    <view class="stat-card">
      <view class="month-selector">
        <text class="month">{{ currentMonth }}月</text>
        <text class="arrow">▼</text>
      </view>
      <view class="amount-info">
        <view class="income">
          <text class="label">收入</text>
          <text class="value">¥{{ totalIncome }}</text>
        </view>
        <view class="expense">
          <text class="label">支出</text>
          <text class="value">¥{{ totalExpense }}</text>
        </view>
      </view>
    </view>

    <!-- 账单列表 -->
    <view class="bill-list">
      <view v-for="(group, date) in groupedBills" :key="date" class="bill-group">
        <view class="date-header">
          <text class="date">{{ formatDate(date) }}</text>
          <text class="daily-summary">支出: ¥{{ getDailyExpense(group) }}</text>
        </view>
        <view v-for="bill in group" :key="bill.id" class="bill-item" @tap="showBillDetail(bill)">
          <view class="bill-icon" :class="bill.type">
            <text class="iconfont" :class="getIconClass(bill.category)"></text>
          </view>
          <view class="bill-info">
            <text class="category">{{ bill.category }}</text>
            <text class="remark">{{ bill.remark || '无备注' }}</text>
          </view>
          <text class="amount" :class="bill.type">¥{{ bill.amount }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

export default {
  setup() {
    const currentMonth = ref(dayjs().month() + 1)
    const bills = ref([
      {
        id: 1,
        date: '2024-03-20',
        type: 'expense',
        category: '餐饮',
        amount: 25.5,
        remark: '午餐'
      },
      {
        id: 2,
        date: '2024-03-20',
        type: 'income',
        category: '工资',
        amount: 5000,
        remark: '3月工资'
      }
    ])

    const groupedBills = computed(() => {
      const groups = {}
      bills.value.forEach(bill => {
        if (!groups[bill.date]) {
          groups[bill.date] = []
        }
        groups[bill.date].push(bill)
      })
      return groups
    })

    const totalIncome = computed(() => {
      return bills.value
        .filter(bill => bill.type === 'income')
        .reduce((sum, bill) => sum + bill.amount, 0)
        .toFixed(2)
    })

    const totalExpense = computed(() => {
      return bills.value
        .filter(bill => bill.type === 'expense')
        .reduce((sum, bill) => sum + bill.amount, 0)
        .toFixed(2)
    })

    const formatDate = (date) => {
      return dayjs(date).format('MM月DD日')
    }

    const getDailyExpense = (bills) => {
      return bills
        .filter(bill => bill.type === 'expense')
        .reduce((sum, bill) => sum + bill.amount, 0)
        .toFixed(2)
    }

    const getIconClass = (category) => {
      const iconMap = {
        '餐饮': 'icon-food',
        '交通': 'icon-transport',
        '购物': 'icon-shopping',
        '工资': 'icon-salary'
      }
      return iconMap[category] || 'icon-other'
    }

    const showBillDetail = (bill) => {
      // 显示账单详情
      console.log('显示账单详情:', bill)
    }

    return {
      currentMonth,
      groupedBills,
      totalIncome,
      totalExpense,
      formatDate,
      getDailyExpense,
      getIconClass,
      showBillDetail
    }
  }
}
</script>

<style>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.stat-card {
  background-color: #07c160;
  border-radius: 20rpx;
  padding: 30rpx;
  color: white;
  margin-bottom: 20rpx;
}

.month-selector {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.month {
  font-size: 32rpx;
  font-weight: bold;
}

.arrow {
  margin-left: 10rpx;
  font-size: 24rpx;
}

.amount-info {
  display: flex;
  justify-content: space-around;
}

.income, .expense {
  text-align: center;
}

.label {
  font-size: 28rpx;
  opacity: 0.8;
}

.value {
  font-size: 36rpx;
  font-weight: bold;
  margin-top: 10rpx;
  display: block;
}

.bill-list {
  background-color: white;
  border-radius: 20rpx;
  padding: 20rpx;
}

.bill-group {
  margin-bottom: 30rpx;
}

.date-header {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
}

.date {
  color: #666;
  font-size: 28rpx;
}

.daily-summary {
  color: #999;
  font-size: 24rpx;
}

.bill-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.bill-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.bill-icon.expense {
  background-color: #ff4d4f;
}

.bill-icon.income {
  background-color: #52c41a;
}

.bill-info {
  flex: 1;
}

.category {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 6rpx;
  display: block;
}

.remark {
  font-size: 24rpx;
  color: #999;
}

.amount {
  font-size: 32rpx;
  font-weight: bold;
}

.amount.expense {
  color: #ff4d4f;
}

.amount.income {
  color: #52c41a;
}
</style> 