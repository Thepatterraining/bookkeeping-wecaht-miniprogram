Page({
  data:{ ledgerNo:'', tab:'bill' },
  onLoad(options){ this.setData({ ledgerNo: options.ledgerNo || '' }) },
  switchTab(e){
    const tab = e.currentTarget.dataset.tab
    this.setData({ tab })
  }
}) 