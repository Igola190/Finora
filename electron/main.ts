import { app, BrowserWindow, ipcMain, Menu } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseService } from "./database";

// ESM polyfill for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let db: DatabaseService;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function createWindow() {
  // Hide the application menu
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0a0a0a",
    show: false,
    icon: path.join(__dirname, "../assets/icon.png"),
    autoHideMenuBar: true,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Initialize database
  db = new DatabaseService();
  await db.initialize();

  // Register IPC handlers
  registerIpcHandlers();

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function registerIpcHandlers() {
  // Accounts
  ipcMain.handle("accounts:getAll", () => db.getAccounts());
  ipcMain.handle("accounts:getById", (_, id: string) => db.getAccountById(id));
  ipcMain.handle("accounts:create", (_, data) => db.createAccount(data));
  ipcMain.handle("accounts:update", (_, id: string, data) =>
    db.updateAccount(id, data),
  );
  ipcMain.handle("accounts:delete", (_, id: string) => db.deleteAccount(id));

  // Categories
  ipcMain.handle("categories:getAll", () => db.getCategories());
  ipcMain.handle("categories:getById", (_, id: string) =>
    db.getCategoryById(id),
  );
  ipcMain.handle("categories:create", (_, data) => db.createCategory(data));
  ipcMain.handle("categories:update", (_, id: string, data) =>
    db.updateCategory(id, data),
  );
  ipcMain.handle("categories:delete", (_, id: string) => db.deleteCategory(id));

  // Transactions
  ipcMain.handle("transactions:getAll", (_, filters?) =>
    db.getTransactions(filters),
  );
  ipcMain.handle("transactions:getById", (_, id: string) =>
    db.getTransactionById(id),
  );
  ipcMain.handle("transactions:create", (_, data) =>
    db.createTransaction(data),
  );
  ipcMain.handle("transactions:update", (_, id: string, data) =>
    db.updateTransaction(id, data),
  );
  ipcMain.handle("transactions:delete", (_, id: string) =>
    db.deleteTransaction(id),
  );
  ipcMain.handle("transactions:getSummary", (_, month: string) =>
    db.getTransactionsSummary(month),
  );

  // Month Closures
  ipcMain.handle("closures:getAll", () => db.getMonthClosures());
  ipcMain.handle("closures:getByMonth", (_, month: string) =>
    db.getMonthClosureByMonth(month),
  );
  ipcMain.handle("closures:create", (_, data) => db.createMonthClosure(data));
  ipcMain.handle("closures:getStatus", (_, month: string) =>
    db.getMonthClosureStatus(month),
  );

  // Subscriptions
  ipcMain.handle("subscriptions:getAll", () => db.getSubscriptions());
  ipcMain.handle("subscriptions:getById", (_, id: string) =>
    db.getSubscriptionById(id),
  );
  ipcMain.handle("subscriptions:create", (_, data) =>
    db.createSubscription(data),
  );
  ipcMain.handle("subscriptions:update", (_, id: string, data) =>
    db.updateSubscription(id, data),
  );
  ipcMain.handle("subscriptions:delete", (_, id: string) =>
    db.deleteSubscription(id),
  );
  ipcMain.handle("subscriptions:addMember", (_, id: string, data) =>
    db.addSubscriptionMember(id, data),
  );
  ipcMain.handle("subscriptions:updateMember", (_, memberId: string, data) =>
    db.updateSubscriptionMember(memberId, data),
  );
  ipcMain.handle(
    "subscriptions:removeMember",
    (_, id: string, memberId: string) =>
      db.removeSubscriptionMember(id, memberId),
  );
  ipcMain.handle("subscriptions:recordMemberPayment", (_, memberId: string, data) =>
    db.recordMemberPayment(memberId, data),
  );
  ipcMain.handle("subscriptions:getMemberPayments", (_, memberId: string, month?: string) =>
    db.getMemberPayments(memberId, month),
  );
  ipcMain.handle("subscriptions:deleteMemberPayment", (_, paymentId: string) =>
    db.deleteMemberPayment(paymentId),
  );
  ipcMain.handle("subscriptions:getMembersSummary", (_, subscriptionId: string, month: string) =>
    db.getSubscriptionMembersSummary(subscriptionId, month),
  );

  // Financial Goals
  ipcMain.handle("goals:getAll", () => db.getFinancialGoals());
  ipcMain.handle("goals:getById", (_, id: string) =>
    db.getFinancialGoalById(id),
  );
  ipcMain.handle("goals:create", (_, data) => db.createFinancialGoal(data));
  ipcMain.handle("goals:update", (_, id: string, data) =>
    db.updateFinancialGoal(id, data),
  );
  ipcMain.handle("goals:delete", (_, id: string) => db.deleteFinancialGoal(id));
  ipcMain.handle("goals:addProgress", (_, id: string, amount: number) =>
    db.addGoalProgress(id, amount),
  );

  // Tags
  ipcMain.handle("tags:getAll", () => db.getTags());
  ipcMain.handle("tags:create", (_, data) => db.createTag(data));
  ipcMain.handle("tags:update", (_, id: string, data) =>
    db.updateTag(id, data),
  );
  ipcMain.handle("tags:delete", (_, id: string) => db.deleteTag(id));
  ipcMain.handle(
    "tags:addToTransaction",
    (_, transactionId: string, tagId: string) =>
      db.addTagToTransaction(transactionId, tagId),
  );
  ipcMain.handle(
    "tags:removeFromTransaction",
    (_, transactionId: string, tagId: string) =>
      db.removeTagFromTransaction(transactionId, tagId),
  );
  ipcMain.handle(
    "tags:setTransactionTags",
    (_, transactionId: string, tagIds: string[]) =>
      db.setTransactionTags(transactionId, tagIds),
  );

  // Bills
  ipcMain.handle("bills:getAll", (_, filters?) => db.getBills(filters));
  ipcMain.handle("bills:getById", (_, id: string) => db.getBillById(id));
  ipcMain.handle("bills:create", (_, data) => db.createBill(data));
  ipcMain.handle("bills:update", (_, id: string, data) =>
    db.updateBill(id, data),
  );
  ipcMain.handle("bills:delete", (_, id: string) => db.deleteBill(id));
  ipcMain.handle("bills:markAsPaid", (_, id: string) =>
    db.markBillAsPaid(id),
  );
  ipcMain.handle("bills:markAsUnpaid", (_, id: string) =>
    db.markBillAsUnpaid(id),
  );
  ipcMain.handle("bills:getUpcoming", (_, days?: number) =>
    db.getUpcomingBills(days),
  );
  ipcMain.handle("bills:getOverdue", () => db.getOverdueBills());

  // Subscription Alerts
  ipcMain.handle("subscriptionAlerts:getAlerts", (_, days?: number) =>
    db.getSubscriptionAlerts(days),
  );

  // Dashboard
  ipcMain.handle("dashboard:getSummary", () => db.getDashboardSummary());
}
