import { contextBridge, ipcRenderer } from "electron";

const api = {
  // Accounts
  accounts: {
    getAll: () => ipcRenderer.invoke("accounts:getAll"),
    getById: (id: string) => ipcRenderer.invoke("accounts:getById", id),
    create: (data: any) => ipcRenderer.invoke("accounts:create", data),
    update: (id: string, data: any) =>
      ipcRenderer.invoke("accounts:update", id, data),
    delete: (id: string) => ipcRenderer.invoke("accounts:delete", id),
  },

  // Categories
  categories: {
    getAll: () => ipcRenderer.invoke("categories:getAll"),
    getById: (id: string) => ipcRenderer.invoke("categories:getById", id),
    create: (data: any) => ipcRenderer.invoke("categories:create", data),
    update: (id: string, data: any) =>
      ipcRenderer.invoke("categories:update", id, data),
    delete: (id: string) => ipcRenderer.invoke("categories:delete", id),
  },

  // Transactions
  transactions: {
    getAll: (filters?: any) =>
      ipcRenderer.invoke("transactions:getAll", filters),
    getById: (id: string) => ipcRenderer.invoke("transactions:getById", id),
    create: (data: any) => ipcRenderer.invoke("transactions:create", data),
    update: (id: string, data: any) =>
      ipcRenderer.invoke("transactions:update", id, data),
    delete: (id: string) => ipcRenderer.invoke("transactions:delete", id),
    getSummary: (month: string) =>
      ipcRenderer.invoke("transactions:getSummary", month),
  },

  // Month Closures
  closures: {
    getAll: () => ipcRenderer.invoke("closures:getAll"),
    getByMonth: (month: string) =>
      ipcRenderer.invoke("closures:getByMonth", month),
    create: (data: any) => ipcRenderer.invoke("closures:create", data),
    getStatus: (month: string) =>
      ipcRenderer.invoke("closures:getStatus", month),
  },

  // Subscriptions
  subscriptions: {
    getAll: () => ipcRenderer.invoke("subscriptions:getAll"),
    getById: (id: string) => ipcRenderer.invoke("subscriptions:getById", id),
    create: (data: any) => ipcRenderer.invoke("subscriptions:create", data),
    update: (id: string, data: any) =>
      ipcRenderer.invoke("subscriptions:update", id, data),
    delete: (id: string) => ipcRenderer.invoke("subscriptions:delete", id),
    addMember: (id: string, data: any) =>
      ipcRenderer.invoke("subscriptions:addMember", id, data),
    updateMember: (memberId: string, data: any) =>
      ipcRenderer.invoke("subscriptions:updateMember", memberId, data),
    removeMember: (id: string, memberId: string) =>
      ipcRenderer.invoke("subscriptions:removeMember", id, memberId),
    recordMemberPayment: (memberId: string, data: any) =>
      ipcRenderer.invoke("subscriptions:recordMemberPayment", memberId, data),
    getMemberPayments: (memberId: string, month?: string) =>
      ipcRenderer.invoke("subscriptions:getMemberPayments", memberId, month),
    deleteMemberPayment: (paymentId: string) =>
      ipcRenderer.invoke("subscriptions:deleteMemberPayment", paymentId),
    getMembersSummary: (subscriptionId: string, month: string) =>
      ipcRenderer.invoke("subscriptions:getMembersSummary", subscriptionId, month),
  },

  // Financial Goals
  goals: {
    getAll: () => ipcRenderer.invoke("goals:getAll"),
    getById: (id: string) => ipcRenderer.invoke("goals:getById", id),
    create: (data: any) => ipcRenderer.invoke("goals:create", data),
    update: (id: string, data: any) =>
      ipcRenderer.invoke("goals:update", id, data),
    delete: (id: string) => ipcRenderer.invoke("goals:delete", id),
    addProgress: (id: string, amount: number) =>
      ipcRenderer.invoke("goals:addProgress", id, amount),
  },

  // Tags
  tags: {
    getAll: () => ipcRenderer.invoke("tags:getAll"),
    create: (data: any) => ipcRenderer.invoke("tags:create", data),
    update: (id: string, data: any) =>
      ipcRenderer.invoke("tags:update", id, data),
    delete: (id: string) => ipcRenderer.invoke("tags:delete", id),
    addToTransaction: (transactionId: string, tagId: string) =>
      ipcRenderer.invoke("tags:addToTransaction", transactionId, tagId),
    removeFromTransaction: (transactionId: string, tagId: string) =>
      ipcRenderer.invoke("tags:removeFromTransaction", transactionId, tagId),
    setTransactionTags: (transactionId: string, tagIds: string[]) =>
      ipcRenderer.invoke("tags:setTransactionTags", transactionId, tagIds),
  },

  // Bills
  bills: {
    getAll: (filters?: any) => ipcRenderer.invoke("bills:getAll", filters),
    getById: (id: string) => ipcRenderer.invoke("bills:getById", id),
    create: (data: any) => ipcRenderer.invoke("bills:create", data),
    update: (id: string, data: any) =>
      ipcRenderer.invoke("bills:update", id, data),
    delete: (id: string) => ipcRenderer.invoke("bills:delete", id),
    markAsPaid: (id: string) => ipcRenderer.invoke("bills:markAsPaid", id),
    markAsUnpaid: (id: string) => ipcRenderer.invoke("bills:markAsUnpaid", id),
    getUpcoming: (days?: number) =>
      ipcRenderer.invoke("bills:getUpcoming", days),
    getOverdue: () => ipcRenderer.invoke("bills:getOverdue"),
  },

  // Subscription Alerts
  subscriptionAlerts: {
    getAlerts: (days?: number) =>
      ipcRenderer.invoke("subscriptionAlerts:getAlerts", days),
  },

  // Salary Distribution
  salaryDistribution: {
    get: () => ipcRenderer.invoke("salaryDistribution:get"),
    save: (data: any) => ipcRenderer.invoke("salaryDistribution:save", data),
    delete: () => ipcRenderer.invoke("salaryDistribution:delete"),
  },

  // Dashboard
  dashboard: {
    getSummary: () => ipcRenderer.invoke("dashboard:getSummary"),
  },
};

contextBridge.exposeInMainWorld("api", api);

export type API = typeof api;
