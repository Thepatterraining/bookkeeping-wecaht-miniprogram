Component({
  properties: {
    // 是否显示日期选择器
    show: {
      type: Boolean,
      value: false
    },
    // 默认选中的日期，格式为YYYY-MM-DD
    defaultDate: {
      type: String,
      value: ''
    }
  },

  data: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    days: [],
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    selectedDate: null,
    today: new Date().setHours(0, 0, 0, 0)
  },

  observers: {
    'show': function(show) {
      if (show) {
        this.initCalendar();
      }
    },
    'defaultDate': function(date) {
      if (date) {
        const [year, month, day] = date.split('-').map(Number);
        this.setData({
          year,
          month,
          day,
          selectedDate: new Date(year, month - 1, day).setHours(0, 0, 0, 0)
        });
        this.generateDays(year, month);
      }
    }
  },

  lifetimes: {
    attached() {
      this.initCalendar();
    }
  },

  methods: {
    // 初始化日历
    initCalendar() {
      const now = new Date();
      let { year, month, day } = this.data;

      // 如果有默认日期，使用默认日期
      if (this.properties.defaultDate) {
        const [y, m, d] = this.properties.defaultDate.split('-').map(Number);
        year = y;
        month = m;
        day = d;
      }

      this.setData({
        year,
        month,
        day,
        selectedDate: new Date(year, month - 1, day).setHours(0, 0, 0, 0)
      });

      this.generateDays(year, month);
    },

    // 生成当月的日期数据
    generateDays(year, month) {
      const days = [];
      const firstDay = new Date(year, month - 1, 1).getDay(); // 当月第一天是星期几
      const lastDate = new Date(year, month, 0).getDate(); // 当月最后一天是几号

      // 上个月的日期
      const prevMonthLastDate = new Date(year, month - 1, 0).getDate();
      for (let i = 0; i < firstDay; i++) {
        const date = new Date(year, month - 2, prevMonthLastDate - firstDay + i + 1);
        days.push({
          date: date.getDate(),
          month: 'prev',
          timestamp: date.setHours(0, 0, 0, 0)
        });
      }

      // 当月的日期
      for (let i = 1; i <= lastDate; i++) {
        const date = new Date(year, month - 1, i);
        days.push({
          date: i,
          month: 'current',
          timestamp: date.setHours(0, 0, 0, 0)
        });
      }

      // 下个月的日期
      const nextDays = 42 - days.length; // 6行7列，共42个日期
      for (let i = 1; i <= nextDays; i++) {
        const date = new Date(year, month, i);
        days.push({
          date: i,
          month: 'next',
          timestamp: date.setHours(0, 0, 0, 0)
        });
      }

      this.setData({ days });
    },

    // 上个月
    prevMonth() {
      let { year, month } = this.data;
      if (month === 1) {
        year--;
        month = 12;
      } else {
        month--;
      }
      this.setData({ year, month });
      this.generateDays(year, month);
    },

    // 下个月
    nextMonth() {
      let { year, month } = this.data;
      if (month === 12) {
        year++;
        month = 1;
      } else {
        month++;
      }
      this.setData({ year, month });
      this.generateDays(year, month);
    },

    // 选择日期
    selectDate(e) {
      const { timestamp, month } = e.currentTarget.dataset;

      // 如果点击的是上个月或下个月的日期，切换到对应月份
      if (month === 'prev') {
        this.prevMonth();
      } else if (month === 'next') {
        this.nextMonth();
      }

      const date = new Date(timestamp);
      this.setData({
        selectedDate: timestamp,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      });
    },

    // 确认选择
    confirm() {
      const { year, month, day } = this.data;
      const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      this.triggerEvent('confirm', { date: formattedDate });
      this.triggerEvent('close');
    },

    // 取消选择
    cancel() {
      this.triggerEvent('close');
    },

    // 选择今天
    selectToday() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();

      this.setData({
        year,
        month,
        day,
        selectedDate: now.setHours(0, 0, 0, 0)
      });

      this.generateDays(year, month);
    }
  }
})
