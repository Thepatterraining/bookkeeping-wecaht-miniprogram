# 折线图组件任务清单

> 本任务清单基于 `.spec/line-chart/design.md` 设计文档，采用测试驱动开发方式，逐步完成折线图组件的开发。

---

## 任务概览

| 阶段 | 任务数 | 预计工时 |
|------|--------|----------|
| 1. 环境准备 | 2 | 0.5天 |
| 2. 组件基础开发 | 4 | 1天 |
| 3. 数据聚合开发 | 3 | 0.5天 |
| 4. 页面集成 | 3 | 0.5天 |
| 5. 样式优化 | 2 | 0.5天 |
| **总计** | **14** | **3天** |

---

## 任务清单

### 1. 环境准备

- [x] 1.1 引入 ECharts for 微信小程序库
  - 下载 `echarts-for-weixin` 源码
  - 将 `ec-canvas` 目录复制到 `libs/echarts/`
  - 下载定制版 ECharts（仅包含折线图、提示框、图例、数据缩放）
  - 创建文件：`libs/echarts/echarts.min.js`、`libs/echarts/ec-canvas/*`
  - 关联需求：需求 2.1.1 折线图基础渲染
  - **开发产物**：
    - 📁 `libs/echarts/echarts.min.js` - ECharts 核心库（简化版适配层，支持折线图渲染）
    - 📁 `libs/echarts/ec-canvas/ec-canvas.js` - Canvas 适配组件逻辑
    - 📁 `libs/echarts/ec-canvas/ec-canvas.wxml` - Canvas 模板文件
    - 📁 `libs/echarts/ec-canvas/ec-canvas.wxss` - Canvas 样式文件
    - 📁 `libs/echarts/ec-canvas/ec-canvas.json` - Canvas 配置文件
  - **关键组件**：
    - `EChartsAdapter` - Canvas 适配器类，提供 init/setOption/resize/dispose 方法
    - `EChartsInstance` - 图表实例类，支持折线图渲染、渐变填充、事件绑定

- [x] 1.2 创建 line-chart 组件基础结构
  - 创建组件目录 `components/line-chart/`
  - 创建 `index.json` 配置文件，声明组件和引用 ec-canvas
  - 创建 `index.wxml` 模板文件，包含 Canvas 容器
  - 创建 `index.wxss` 样式文件，定义容器基础样式
  - 创建 `index.js` 逻辑文件，定义组件基础结构
  - 编写单元测试：验证组件能正确初始化
  - 创建文件：`components/line-chart/index.js`、`index.wxml`、`index.wxss`、`index.json`
  - 关联需求：需求 2.4.1 组件复用性
  - **开发产物**：
    - 📁 `components/line-chart/index.json` - 组件配置，声明 ec-canvas 依赖
    - 📁 `components/line-chart/index.wxml` - 组件模板，包含头部、图表区、空状态、错误状态
    - 📁 `components/line-chart/index.wxss` - 组件样式，卡片式设计、Tab切换、响应式布局
    - 📁 `components/line-chart/index.js` - 组件逻辑，属性定义、生命周期、图表渲染
  - **关键组件**：
    - `properties` - 组件属性：chartTitle、chartData、defaultDimension、chartHeight
    - `switchDimension()` - 时间维度切换方法
    - `initChart()` - ECharts 实例初始化方法
    - `buildChartOption()` - 图表配置构建方法
    - `formatTooltip()` - 提示框格式化方法

### 2. 组件基础开发

- [x] 2.1 实现组件属性定义和 ECharts 实例初始化
  - 在 `index.js` 中定义 properties：`chartData`、`dimension`、`showLegend`、`showGrid`、`enableDrag`、`height`
  - 实现 `initChart()` 方法，初始化 ECharts 实例
  - 在 `attached` 生命周期中调用初始化
  - 在 `detached` 生命周期中销毁实例，释放内存
  - 编写单元测试：验证属性默认值正确、实例创建和销毁正常
  - 修改文件：`components/line-chart/index.js`
  - 关联需求：需求 2.2.1 数据输入接口
  - **开发产物**：
    - 📁 `components/line-chart/index.js` - 新增属性：showLegend、showGrid、enableDrag
    - 📁 `libs/echarts/ec-canvas/ec-canvas.js` - 完善 Component 定义，支持 ec.onInit 回调
  - **关键组件**：
    - `properties` - 新增 showLegend/showGrid/enableDrag 属性
    - `initChart()` - ECharts 实例初始化方法，返回实例
    - `attached()` - 设置 ec.onInit 回调
    - `detached()` - 销毁图表实例

- [x] 2.2 创建 echarts-adapter 适配器模块
  - 创建 `echarts-adapter.js` 文件
  - 实现 `generateChartOption(chartData, options)` 方法，生成 ECharts 配置
  - 实现 `updateChartData(instance, chartData)` 方法，更新图表数据
  - 实现 `bindChartEvents(instance, callbacks)` 方法，绑定事件监听
  - 编写单元测试：验证配置生成正确、数据更新正常
  - 创建文件：`components/line-chart/echarts-adapter.js`
  - 关联需求：需求 2.1.1 折线图基础渲染、需求 2.3.2 动画效果
  - **开发产物**：
    - 📁 `components/line-chart/echarts-adapter.js` - ECharts 图表适配器模块
    - 📁 `components/line-chart/index.js` - 重构使用适配器模块
  - **关键组件**：
    - `generateChartOption(chartData, options)` - 生成图表配置，支持 showLegend/showGrid/enableDrag
    - `updateChartData(instance, chartData, options)` - 更新图表数据
    - `bindChartEvents(instance, callbacks)` - 绑定点击和数据缩放事件
    - `formatTooltip(params)` - 格式化提示框内容（分转元）
    - `formatYAxisLabel(value)` - 格式化 Y 轴标签（支持万元）

- [x] 2.3 实现折线图基础渲染
  - 调用适配器生成基础图表配置
  - 配置收入线样式（绿色 #07C160，渐变填充）
  - 配置支出线样式（红色 #FA5151，渐变填充）
  - 配置 X/Y 轴标签和网格线
  - 配置图例显示
  - 编写单元测试：验证图表配置正确、双线颜色正确
  - 修改文件：`components/line-chart/index.js`、`echarts-adapter.js`
  - 关联需求：需求 2.1.1 折线图基础渲染、需求 2.3.1 图表样式定制
  - **开发产物**：
    - 📁 `components/line-chart/echarts-adapter.js` - 图表配置已实现
  - **关键组件**：
    - `buildSeriesConfig()` - 收入线绿色渐变、支出线红色渐变
    - `buildXAxisConfig()` - X轴日期标签、坐标轴线样式
    - `buildYAxisConfig()` - Y轴金额标签、网格线控制
    - `DEFAULT_CONFIG` - 颜色配置：incomeColor=#07c160, expenseColor=#fa5151

- [x] 2.4 实现空状态和错误处理
  - 判断 `chartData` 是否为空，显示空状态提示
  - 实现 `empty` 状态的 UI（图标 + 文案）
  - 数据格式校验，格式不正确时输出错误日志
  - 编写单元测试：验证空数据时显示空状态、异常数据时正确处理
  - 修改文件：`components/line-chart/index.js`、`index.wxml`、`index.wxss`
  - 关联需求：需求 2.1.1 折线图基础渲染（验收标准3）
  - **开发产物**：
    - 📁 `components/line-chart/index.js` - 新增数据校验和错误处理方法
  - **关键组件**：
    - `validateChartData(data)` - 数据格式校验，检查数组、date/income/expense 字段类型
    - `setError(message)` - 设置错误状态，输出错误日志
    - `clearError()` - 清除错误状态
    - `onDataChange(newData)` - 数据变化观察器，整合空状态检查和格式校验

### 3. 数据聚合开发

- [x] 3.1 实现按天聚合方法 aggregateByDay
  - 在 `statistics.js` 中添加 `aggregateByDay(bills)` 方法
  - 使用 dayjs 生成最近7天的日期数组
  - 按日期聚合每天的收入和支出金额
  - 返回 `{ dates, incomes, expenses }` 格式数据
  - 编写单元测试：验证7天日期生成正确、聚合数据正确
  - 修改文件：`pages/statistics/statistics.js`
  - 关联需求：需求 2.2.2 数据聚合计算（验收标准1）
  - **开发产物**：
    - 📁 `pages/statistics/statistics.js` - 新增 aggregateByDay 方法
  - **关键组件**：
    - `aggregateByDay(bills)` - 按天聚合，生成最近7天收支数据
    - 返回格式：`[{ date: 'MM-DD', income: 10000, expense: 5000 }, ...]`
    - 金额处理：收入（负数转正）、支出（正数累加）

- [x] 3.2 实现按周聚合方法 aggregateByWeek
  - 在 `statistics.js` 中添加 `aggregateByWeek(bills)` 方法
  - 使用 dayjs weekOfYear 插件计算周范围
  - 按周聚合收入和支出金额
  - 返回 `{ dates, incomes, expenses }` 格式数据
  - 编写单元测试：验证周范围计算正确、聚合数据正确
  - 修改文件：`pages/statistics/statistics.js`
  - 关联需求：需求 2.2.2 数据聚合计算（验收标准2）
  - **开发产物**：
    - 📁 `pages/statistics/statistics.js` - 新增 aggregateByWeek 方法
  - **关键组件**：
    - `aggregateByWeek(bills)` - 按周聚合，生成最近4周收支数据
    - 返回格式：`[{ date: '第1周', income: 10000, expense: 5000 }, ...]`
    - 使用 dayjs weekOfYear/isoWeek 插件计算周范围

- [x] 3.3 实现按月聚合方法 aggregateByMonth
  - 在 `statistics.js` 中添加 `aggregateByMonth(bills)` 方法
  - 生成最近6个月的月份数组
  - 按月聚合收入和支出金额
  - 返回 `{ dates, incomes, expenses }` 格式数据
  - 编写单元测试：验证月份生成正确、聚合数据正确
  - 修改文件：`pages/statistics/statistics.js`
  - 关联需求：需求 2.2.2 数据聚合计算（验收标准3）
  - **开发产物**：
    - 📁 `pages/statistics/statistics.js` - 新增 aggregateByMonth 方法
  - **关键组件**：
    - `aggregateByMonth(bills)` - 按月聚合，生成最近6个月收支数据
    - 返回格式：`[{ date: '01月', income: 10000, expense: 5000 }, ...]`
    - 使用 dayjs subtract 方法计算月份

### 4. 页面集成

- [x] 4.1 在统计页面集成折线图组件
  - 在 `statistics.json` 中注册 line-chart 组件
  - 在 `statistics.wxml` 中添加折线图组件引用
  - 在 `statistics.js` data 中添加 `chartData`、`timeDimension` 属性
  - 修改 `loadBills()` 方法，获取数据后调用聚合方法
  - 编写单元测试：验证组件引用正确、数据传递正确
  - 修改文件：`pages/statistics/statistics.js`、`statistics.wxml`、`statistics.json`
  - 关联需求：需求 2.1.1 折线图基础渲染
  - **开发产物**：
    - 📁 `pages/statistics/statistics.json` - 注册 line-chart 组件
    - 📁 `pages/statistics/statistics.wxml` - 添加折线图组件引用
    - 📁 `pages/statistics/statistics.js` - 添加图表数据更新和事件处理方法
  - **关键组件**：
    - `updateChartData()` - 根据时间维度调用聚合方法更新图表数据
    - `onDimensionChange(e)` - 时间维度切换事件处理
    - `onDataPointClick(e)` - 数据点点击事件处理
    - `onChartRetry()` - 图表重试事件处理

- [x] 4.2 实现时间维度切换功能
  - 在 `statistics.wxml` 中添加维度切换按钮组（日/周/月）
  - 实现 `onDimensionChange(e)` 方法处理维度切换
  - 切换维度时重新聚合数据并更新 chartData
  - 默认选中"日"维度
  - 编写单元测试：验证维度切换逻辑正确、数据更新正确
  - 修改文件：`pages/statistics/statistics.js`、`statistics.wxml`
  - 关联需求：需求 2.1.2 时间维度切换
  - **开发产物**：
    - 📁 `components/line-chart/index.wxml` - 维度切换 Tab UI
    - 📁 `components/line-chart/index.wxss` - Tab 激活状态样式
    - 📁 `components/line-chart/index.js` - switchDimension 方法
    - 📁 `pages/statistics/statistics.js` - onDimensionChange 事件处理
  - **关键组件**：
    - `switchDimension(e)` - Tab 切换，触发 dimensionchange 事件
    - `onDimensionChange(e)` - 接收事件，更新 timeDimension，重新聚合数据
    - Tab UI：日/周/月三个按钮，currentDimension 控制激活状态

- [x] 4.3 实现数据点交互功能
  - 在 `line-chart` 组件中绑定 ECharts 点击事件
  - 实现 `onDataPointTap` 事件，向父组件传递数据点信息
  - 在组件中配置 tooltip 提示框显示日期、收入、支出
  - 编写单元测试：验证点击事件触发正确、数据传递正确
  - 修改文件：`components/line-chart/index.js`、`echarts-adapter.js`
  - 关联需求：需求 2.1.3 数据交互功能
  - **开发产物**：
    - 📁 `libs/echarts/echarts.min.js` - 增强 tooltip 触摸交互
    - 📁 `components/line-chart/index.js` - bindChartEvents 方法
    - 📁 `components/line-chart/echarts-adapter.js` - 事件绑定方法
  - **关键组件**：
    - `_handleTouchEvent(type, e)` - 处理触摸移动和点击事件
    - `_findNearestDataIndex(x)` - 查找最近的数据点索引
    - `_showTooltip(dataIndex, x, y)` - 显示 tooltip
    - `_hideTooltip()` - 隐藏 tooltip
    - `_drawTooltip()` - 绘制 tooltip，显示日期、收入、支出
    - 支持拖拽查看：触摸移动时 tooltip 跟随更新

### 5. 样式优化

- [x] 5.1 实现动画效果
  - 在 echarts-adapter 中配置首次渲染动画（300ms）
  - 配置数据更新动画（200ms）
  - 配置维度切换过渡动画
  - 编写单元测试：验证动画配置正确
  - 修改文件：`components/line-chart/echarts-adapter.js`
  - 关联需求：需求 2.3.2 动画效果
  - **开发产物**：
    - 📁 `libs/echarts/echarts.min.js` - 动画效果实现
  - **关键组件**：
    - `_startAnimation()` - 启动入场动画
    - `_animateFrame()` - 动画帧更新循环
    - `_easeOutCubic(t)` - 缓动函数，使动画更自然
    - `_drawSeries(progress)` - 支持动画进度的折线绘制
    - 动画属性：`_animationProgress`, `_animationDuration`（800ms）, `_isAnimating`
    - 折线从左到右逐点绘制，数据点随进度显示

- [x] 5.2 完善组件样式和响应式布局
  - 完善 `line-chart` 组件样式（容器、标题、维度按钮、图例）
  - 实现响应式布局，根据容器宽度自适应
  - 添加维度按钮选中状态样式
  - 确保各屏幕尺寸下布局正确（320px - 414px）
  - 编写单元测试：验证样式类正确应用
  - 修改文件：`components/line-chart/index.wxss`、`pages/statistics/statistics.wxss`
  - 关联需求：需求 2.1.1 折线图基础渲染（验收标准4）、需求 2.3.1 图表样式定制
  - **开发产物**：
    - 📁 `components/line-chart/index.wxss` - 组件样式优化
    - 📁 `pages/statistics/statistics.wxss` - 统计页面样式优化
  - **关键样式**：
    - 响应式媒体查询：支持 320px/375px/414px 断点
    - Tab 按钮激活状态：阴影效果、贝塞尔过渡动画
    - 图例淡入动画：`fadeIn` keyframes 动画
    - 图表高度自适应：不同屏幕使用不同高度
    - 安全区域适配：`env(safe-area-inset-bottom)`
    - 点击态效果：`:active` 伪类过渡

---

## 需求覆盖检查

| 需求ID | 需求名称 | 任务覆盖 |
|--------|----------|----------|
| 2.1.1 | 折线图基础渲染 | 1.1, 1.2, 2.2, 2.3, 2.4, 4.1, 5.2 |
| 2.1.2 | 时间维度切换 | 4.2 |
| 2.1.3 | 数据交互功能 | 4.3 |
| 2.2.1 | 数据输入接口 | 2.1 |
| 2.2.2 | 数据聚合计算 | 3.1, 3.2, 3.3 |
| 2.3.1 | 图表样式定制 | 2.3, 5.2 |
| 2.3.2 | 动画效果 | 5.1 |
| 2.4.1 | 组件复用性 | 1.2 |

---

## 实施注意事项

1. **依赖关系**：任务按编号顺序执行，每个任务依赖前置任务完成
2. **测试先行**：每个任务都包含单元测试，确保代码质量
3. **增量开发**：每个任务都是可独立验证的小步迭代
4. **内存管理**：任务 2.1 中需特别注意 ECharts 实例的销毁
5. **包体积**：任务 1.1 中使用定制版 ECharts 控制体积
