<template>
  <view class="container">
    <!-- 时间选择器 -->
    <view class="time-selector">
      <picker 
        mode="date" 
        fields="month" 
        :value="currentMonth" 
        @change="onMonthChange"
      >
        <view class="picker-content">
          {{ formatMonth(currentMonth) }}
          <text class="arrow">▼</text>
        </view>
      </picker>
    </view>

    <!-- 收支概览 -->
    <view class="overview-card">
      <view class="overview-item">
        <text class="label">收入</text>
        <text class="value income">¥{{ totalIncome }}</text>
      </view>
      <view class="overview-item">
        <text class="label">支出</text>
        <text class="value expense">¥{{ totalExpense }}</text>
      </view>
      <view class="overview-item">
        <text class="label">结余</text>
        <text class="value" :class="balanceClass">¥{{ balance }}</text>
      </view>
    </view>

    <!-- 支出分类统计 -->
    <view class="stat-section">
      <view class="section-header">
        <text class="title">支出分类</text>
        <text class="total">总计: ¥{{ totalExpense }}</text>
      </view>
      <view class="category-list">
        <view 
          v-for="category in expenseCategories" 
          :key="category.name"
          class="category-item"
        >
          <view class="category-info">
            <text class="iconfont" :class="category.icon"></text>
            <text class="name">{{ category.name }}</text>
          </view>
          <view class="category-amount">
            <text class="amount">¥{{ category.amount }}</text>
            <text class="percentage">{{ category.percentage }}%</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 收入分类统计 -->
    <view class="stat-section">
      <view class="section-header">
        <text class="title">收入分类</text>
        <text class="total">总计: ¥{{ totalIncome }}</text>
      </view>
      <view class="category-list">
        <view 
          v-for="category in incomeCategories" 
          :key="category.name"
          class="category-item"
        >
          <view class="category-info">
            <text class="iconfont" :class="category.icon"></text>
            <text class="name">{{ category.name }}</text>
          </view>
          <view class="category-amount">
            <text class="amount">¥{{ category.amount }}</text>
            <text class="percentage">{{ category.percentage }}%</text>
          </view>
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
    const currentMonth = ref(dayjs().format('YYYY-MM'))
    
    // 模拟数据
    const expenseCategories = ref([
      { name: '餐饮', icon: 'icon-food', amount: 1500, percentage: 30 },
      { name: '交通', icon: 'icon-transport', amount: 800, percentage: 16 },
      { name: '购物', icon: 'icon-shopping', amount: 1200, percentage: 24 },
      { name: '娱乐', icon: 'icon-entertainment', amount: 500, percentage: 10 },
      { name: '其他', icon: 'icon-other', amount: 1000, percentage: 20 }
    ])

    const incomeCategories = ref([
      { name: '工资', icon: 'icon-salary', amount: 8000, percentage: 80 },
      { name: '奖金', icon: 'icon-bonus', amount: 1000, percentage: 10 },
      { name: '其他', icon: 'icon-other', amount: 1000, percentage: 10 }
    ])

    const totalExpense = computed(() => {
      return expenseCategories.value
        .reduce((sum, category) => sum + category.amount, 0)
        .toFixed(2)
    })

    const totalIncome = computed(() => {
      return incomeCategories.value
        .reduce((sum, category) => sum + category.amount, 0)
        .toFixed(2)
    })

    const balance = computed(() => {
      return (parseFloat(totalIncome.value) - parseFloat(totalExpense.value)).toFixed(2)
    })

    const balanceClass = computed(() => {
      return parseFloat(balance.value) >= 0 ? 'income' : 'expense'
    })

    const formatMonth = (monthStr) => {
      return dayjs(monthStr).format('YYYY年MM月')
    }

    const onMonthChange = (e) => {
      currentMonth.value = e.detail.value
      // TODO: 根据选择的月份重新获取数据
    }

    return {
      currentMonth,
      expenseCategories,
      incomeCategories,
      totalExpense,
      totalIncome,
      balance,
      balanceClass,
      formatMonth,
      onMonthChange
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

.time-selector {
  background-color: white;
  padding: 20rpx;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
}

.picker-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 32rpx;
  color: #333;
}

.arrow {
  font-size: 24rpx;
  color: #999;
}

.overview-card {
  background-color: white;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.overview-item {
  text-align: center;
}

.label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
  display: block;
}

.value {
  font-size: 36rpx;
  font-weight: bold;
}

.value.income {
  color: #52c41a;
}

.value.expense {
  color: #ff4d4f;
}

.stat-section {
  background-color: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.total {
  font-size: 28rpx;
  color: #666;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.category-item:last-child {
  border-bottom: none;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.name {
  font-size: 28rpx;
  color: #333;
}

.category-amount {
  text-align: right;
}

.amount {
  font-size: 28rpx;
  color: #333;
  display: block;
}

.percentage {
  font-size: 24rpx;
  color: #999;
}
</style> 