import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Order,
  OrderItem,
  Room,
  Customer,
  LockRecord,
  WaitlistRecord,
  KitchenOrder,
  Coupon,
  OperationLog,
  FinanceRecord,
  ExceptionRecord,
  ApprovalRecord,
  RoleType,
  OperationType,
  FinanceType,
  MergeRecord,
  SplitRecord,
  StaffShift,
  InvoiceInfo,
  MenuItemStock,
  StockLockRecord,
  PeakHourReservation,
  OperationImpact,
} from '../types';
import { applyTransition, canTransition, stateTransitions } from '../lib/stateMachine';
import {
  generateId,
  isTimeOverlap,
  addMinutes,
} from '../lib/utils';
import {
  mockRooms,
  mockOrders,
  mockCustomers,
  mockLockRecords,
  mockWaitlist,
  mockKitchenOrders,
  mockCoupons,
  mockOperationLogs,
  mockFinanceRecords,
  mockExceptionRecords,
  mockApprovalRecords,
  mockMenuItems,
  mockStaffShifts,
  mockMenuItemStocks,
  mockStockLockRecords,
  mockPeakHourReservations,
  mockEnhancedKitchenOrders,
} from '../lib/mockData';

interface AppState {
  currentRole: RoleType;
  currentUserId: string;
  currentUserName: string;

  rooms: Room[];
  orders: Order[];
  customers: Customer[];
  lockRecords: LockRecord[];
  waitlist: WaitlistRecord[];
  kitchenOrders: KitchenOrder[];
  coupons: Coupon[];
  operationLogs: OperationLog[];
  financeRecords: FinanceRecord[];
  exceptionRecords: ExceptionRecord[];
  approvalRecords: ApprovalRecord[];
  menuItems: typeof mockMenuItems;
  mergeRecords: MergeRecord[];
  splitRecords: SplitRecord[];
  staffShifts: StaffShift[];
  invoices: InvoiceInfo[];
  menuItemStocks: MenuItemStock[];
  stockLockRecords: StockLockRecord[];
  peakHourReservations: PeakHourReservation[];

  selectedOrderId: string | null;
  selectedRoomId: string | null;

  setCurrentRole: (role: RoleType) => void;
  setSelectedOrder: (orderId: string | null) => void;
  setSelectedRoom: (roomId: string | null) => void;

  createOrder: (
    data: Partial<Order>
  ) => { success: boolean; order?: Order; error?: string };

  updateOrder: (orderId: string, updates: Partial<Order>) => boolean;

  executeOrderOperation: (
    orderId: string,
    operation: OperationType,
    payload?: Record<string, unknown>,
    remark?: string
  ) => { success: boolean; error?: string };

  payDeposit: (orderId: string, paymentMethod: string) => boolean;

  cancelOrder: (orderId: string, reason?: string) => boolean;

  lockRoom: (
    roomId: string,
    durationMinutes: number,
    reason: string,
    orderId?: string
  ) => boolean;

  unlockRoom: (lockId: string) => boolean;

  addOrderItem: (orderId: string, item: Omit<OrderItem, 'id'>) => boolean;
  removeOrderItem: (orderId: string, itemId: string) => boolean;
  updateOrderItem: (orderId: string, itemId: string, updates: Partial<OrderItem>) => boolean;

  addWaitlist: (data: Omit<WaitlistRecord, 'id' | 'queuePosition' | 'status' | 'createdAt'>) => WaitlistRecord | null;
  promoteWaitlist: (waitlistId: string, roomId: string) => boolean;
  cancelWaitlist: (waitlistId: string) => boolean;

  createApproval: (
    orderId: string,
    type: ApprovalRecord['type'],
    reason: string,
    extraData?: Record<string, unknown>
  ) => ApprovalRecord;

  approveApproval: (approvalId: string, remark?: string) => boolean;
  rejectApproval: (approvalId: string, remark?: string) => boolean;

  addFinanceRecord: (
    orderId: string,
    type: FinanceType,
    amount: number,
    direction: 'in' | 'out',
    paymentMethod?: string,
    remark?: string
  ) => void;

  addException: (
    type: ExceptionRecord['type'],
    severity: ExceptionRecord['severity'],
    description: string,
    orderId?: string,
    roomId?: string
  ) => void;

  resolveException: (exceptionId: string, resolution: string) => boolean;

  deriveOrderStatusFromLogs: (orderId: string) => Order['status'];
  processExpiredOrders: () => void;
  validateLockedFields: (orderId: string, updates: Partial<Order>) => boolean;

  checkRoomAvailable: (
    roomId: string,
    startTime: number,
    endTime: number,
    excludeOrderId?: string
  ) => boolean;

  getRoomBookings: (roomId: string) => Order[];

  addOperationLog: (
    orderId: string,
    type: OperationType,
    remark?: string,
    beforeData?: Record<string, unknown>,
    afterData?: Record<string, unknown>
  ) => void;

  calculateOrderAmount: (orderId: string) => {
    total: number;
    discount: number;
    actual: number;
  };

  mergeRooms: (mainOrderId: string, mergedOrderIds: string[], roomIds: string[]) => boolean;
  splitRoom: (orderId: string, splitOrders: { roomId: string; peopleCount: number }[]) => boolean;

  transferOrder: (orderId: string, targetRoomId: string) => { success: boolean; error?: string };

  applyCoupon: (orderId: string, couponId: string) => boolean;
  applyMemberBenefit: (orderId: string) => boolean;

  createInvoice: (orderId: string, data: Omit<InvoiceInfo, 'id' | 'orderId' | 'status'>) => InvoiceInfo;

  createSplitRecord: (orderId: string, payerRecords: { payerId: string; payerName: string; amount: number }[]) => void;
  paySplitRecord: (splitId: string) => boolean;

  confirmArrival: (orderId: string) => boolean;
  confirmConsumption: (orderId: string) => boolean;
  deductDeposit: (orderId: string) => boolean;
  processRefund: (orderId: string, amount: number, reason: string) => boolean;
  reverseCharge: (orderId: string, financeRecordId: string, reason: string) => boolean;

  chargeLateArrival: (orderId: string, lateMinutes: number) => boolean;
  markNoShow: (orderId: string) => boolean;

  createKitchenOrder: (orderId: string, items: OrderItem[], priority?: 'normal' | 'urgent') => KitchenOrder | null;
  updateKitchenOrderStatus: (kitchenOrderId: string, status: KitchenOrder['status']) => boolean;

  // 库存管理
  lockStock: (orderId: string, menuItemId: string, quantity: number, reason: string) => boolean;
  releaseStock: (orderId: string, menuItemId: string, reason: string) => boolean;
  releaseAllStockForOrder: (orderId: string, reason: string) => void;
  consumeStock: (orderId: string, menuItemId: string, quantity: number) => boolean;
  checkStockAvailable: (menuItemId: string, quantity: number) => boolean;

  // 高峰保留
  createPeakHourReservation: (data: Omit<PeakHourReservation, 'id' | 'createdBy' | 'createdAt'>) => PeakHourReservation;
  togglePeakHourReservation: (reservationId: string) => boolean;
  deletePeakHourReservation: (reservationId: string) => boolean;

  // 从流水推导金额
  deriveOrderAmountFromFinance: (orderId: string) => {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    depositPaid: number;
    depositRefunded: number;
    consumption: number;
    discount: number;
    lateFee: number;
    cancelFee: number;
    noShowFee: number;
  };

  // 计算操作影响（三维时间轴）
  getOperationImpacts: (orderId: string) => OperationImpact[];

  // 预点单管理
  addPreOrderItem: (orderId: string, item: Omit<OrderItem, 'id'>) => boolean;
  removePreOrderItem: (orderId: string, itemId: string) => boolean;
  updatePreOrderItem: (orderId: string, itemId: string, updates: Partial<OrderItem>) => boolean;

  // 备餐时间计算
  calculatePrepTime: (items: OrderItem[]) => number;

  resetAllData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentRole: 'reception',
      currentUserId: 'user-001',
      currentUserName: '前台小王',

      rooms: mockRooms,
      orders: mockOrders,
      customers: mockCustomers,
      lockRecords: mockLockRecords,
      waitlist: mockWaitlist,
      kitchenOrders: mockKitchenOrders,
      coupons: mockCoupons,
      operationLogs: mockOperationLogs,
      financeRecords: mockFinanceRecords,
      exceptionRecords: mockExceptionRecords,
      approvalRecords: mockApprovalRecords,
      menuItems: mockMenuItems,
      mergeRecords: [],
      splitRecords: [],
      staffShifts: mockStaffShifts,
      invoices: [],
      menuItemStocks: mockMenuItemStocks,
      stockLockRecords: mockStockLockRecords,
      peakHourReservations: mockPeakHourReservations,

      selectedOrderId: null,
      selectedRoomId: null,

      setCurrentRole: (role) => {
        const userMap: Record<RoleType, { id: string; name: string }> = {
          reception: { id: 'reception-001', name: '前台小王' },
          customer: { id: 'cust-001', name: '张三' },
          manager: { id: 'manager-001', name: '张经理' },
          cashier: { id: 'cashier-001', name: '收银小李' },
        };
        set({
          currentRole: role,
          currentUserId: userMap[role].id,
          currentUserName: userMap[role].name,
        });
      },

      setSelectedOrder: (orderId) => set({ selectedOrderId: orderId }),
      setSelectedRoom: (roomId) => set({ selectedRoomId: roomId }),

      createOrder: (data) => {
        const state = get();
        const room = state.rooms.find((r) => r.id === data.roomId);
        if (!room) return { success: false, error: '包厢不存在' };

        const startTime = data.reserveStartTime || Date.now();
        const endTime = data.reserveEndTime || addMinutes(startTime, 120);

        if (!state.checkRoomAvailable(room.id, startTime, endTime)) {
          state.addException(
            'conflict',
            'high',
            `包厢${room.name}时间段冲突`,
            undefined,
            room.id
          );
          return { success: false, error: '该时间段已被预订' };
        }

        if (data.peopleCount && data.peopleCount > room.capacity) {
          state.addException(
            'over_capacity',
            'medium',
            `人数${data.peopleCount}人超过包厢容量${room.capacity}人`,
            undefined,
            room.id
          );
        }

        const order: Order = {
          id: generateId('order-'),
          orderNo: `BX${Date.now().toString().slice(-8)}`,
          roomId: room.id,
          roomName: room.name,
          customerId: data.customerId || state.currentUserId,
          customerName: data.customerName || state.currentUserName,
          customerPhone: data.customerPhone || '',
          peopleCount: data.peopleCount || 1,
          reserveStartTime: startTime,
          reserveEndTime: endTime,
          minConsumption: room.minConsumption,
          depositAmount: room.depositAmount,
          depositPaid: false,
          status: 'pending',
          items: [],
          totalAmount: 0,
          discountAmount: 0,
          actualAmount: 0,
          useMemberBenefit: false,
          extendCount: 0,
          isMinConsumptionConfirmed: false,
          remark: data.remark,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: state.currentUserId,
          source: state.currentRole === 'customer' ? 'customer' : 'reception',
        };

        set((s) => ({
          orders: [...s.orders, order],
        }));

        state.addOperationLog(order.id, 'create_order', '创建订单');

        return { success: true, order };
      },

      updateOrder: (orderId, updates) => {
        const state = get();
        const orderIndex = state.orders.findIndex((o) => o.id === orderId);
        if (orderIndex === -1) return false;

        if (!state.validateLockedFields(orderId, updates)) {
          state.addException(
            'system_error',
            'medium',
            `尝试修改已锁定订单字段: ${orderId}`,
            orderId
          );
          return false;
        }

        const beforeData = { ...state.orders[orderIndex] };
        const order = state.orders[orderIndex];

        if ('peopleCount' in updates && order.status === 'arrived') {
          const room = state.rooms.find((r) => r.id === order.roomId);
          if (room && (updates.peopleCount || 0) > room.capacity) {
            state.addException(
              'over_capacity',
              'medium',
              `到店后修改人数${updates.peopleCount}人超过包厢容量${room.capacity}人`,
              orderId,
              room.id
            );
          }
        }

        const updatedOrder = { ...order, ...updates, updatedAt: Date.now() };

        set((s) => ({
          orders: s.orders.map((o, i) => (i === orderIndex ? updatedOrder : o)),
        }));

        state.addOperationLog(
          orderId,
          'update_people',
          '更新订单信息',
          beforeData as unknown as Record<string, unknown>,
          updatedOrder as unknown as Record<string, unknown>
        );

        return true;
      },

      executeOrderOperation: (orderId, operation, payload, remark) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return { success: false, error: '订单不存在' };

        if (!canTransition(order, operation)) {
          return { success: false, error: '当前状态不允许此操作' };
        }

        const beforeData = { ...order };
        const updatedOrder = applyTransition(order, operation, payload);
        if (!updatedOrder) return { success: false, error: '状态转换失败' };

        if (operation === 'cancel_order') {
          const room = state.rooms.find((r) => r.id === order.roomId);
          if (room) {
            set((s) => ({
              rooms: s.rooms.map((r) =>
                r.id === room.id ? { ...r, status: 'available' } : r
              ),
            }));
          }
        }

        if (operation === 'arrive_confirm') {
          const room = state.rooms.find((r) => r.id === order.roomId);
          if (room) {
            set((s) => ({
              rooms: s.rooms.map((r) =>
                r.id === room.id ? { ...r, status: 'occupied' } : r
              ),
            }));
          }
        }

        if (operation === 'consumption_confirm' && updatedOrder.status === 'completed') {
          const room = state.rooms.find((r) => r.id === order.roomId);
          if (room) {
            set((s) => ({
              rooms: s.rooms.map((r) =>
                r.id === room.id ? { ...r, status: 'available' } : r
              ),
            }));
          }
        }

        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
        }));

        state.addOperationLog(
          orderId,
          operation,
          remark,
          beforeData as unknown as Record<string, unknown>,
          updatedOrder as unknown as Record<string, unknown>
        );

        return { success: true };
      },

      payDeposit: (orderId, paymentMethod) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;
        if (order.depositPaid) return false;

        if (order.status === 'cancelled' || order.status === 'no_show' || order.status === 'expired') {
          state.addException(
            'system_error',
            'medium',
            `订单${order.orderNo}状态为${order.status},无法支付定金`,
            orderId
          );
          return false;
        }

        const result = state.executeOrderOperation(orderId, 'pay_deposit');
        if (!result.success) {
          state.addException(
            'payment_failed',
            'high',
            `订单${order.orderNo}定金支付失败: ${result.error}`,
            orderId
          );
          return false;
        }

        state.addFinanceRecord(
          orderId,
          'deposit_pay',
          order.depositAmount,
          'in',
          paymentMethod,
          '定金支付'
        );

        return true;
      },

      simulateDepositPaymentFailure: (orderId, reason) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        state.addException(
          'payment_failed',
          'high',
          `订单${order.orderNo}定金支付失败: ${reason || '网络超时'}`,
          orderId
        );
        state.addOperationLog(orderId, 'pay_deposit', `支付失败: ${reason || '网络超时'}`);

        return true;
      },

      cancelOrder: (orderId, reason) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        const result = state.executeOrderOperation(orderId, 'cancel_order', undefined, reason);
        if (!result.success) return false;

        if (order.depositPaid) {
          const cancelCharge = Math.floor(order.depositAmount * 0.5);
          state.addFinanceRecord(
            orderId,
            'cancel_charge',
            cancelCharge,
            'in',
            'deposit',
            '取消扣款'
          );
          const refundAmount = order.depositAmount - cancelCharge;
          if (refundAmount > 0) {
            state.addFinanceRecord(
              orderId,
              'deposit_refund',
              refundAmount,
              'out',
              'wechat',
              '定金退还'
            );
          }
        }

        return true;
      },

      lockRoom: (roomId, durationMinutes, reason, orderId) => {
        const state = get();
        const room = state.rooms.find((r) => r.id === roomId);
        if (!room || room.status !== 'available') return false;

        const lockRecord: LockRecord = {
          id: generateId('lock-'),
          roomId,
          orderId,
          startTime: Date.now(),
          endTime: addMinutes(Date.now(), durationMinutes),
          reason,
          operatorId: state.currentUserId,
          operatorName: state.currentUserName,
          createdAt: Date.now(),
        };

        set((s) => ({
          lockRecords: [...s.lockRecords, lockRecord],
          rooms: s.rooms.map((r) =>
            r.id === roomId ? { ...r, status: 'locked' } : r
          ),
        }));

        return true;
      },

      unlockRoom: (lockId) => {
        const state = get();
        const lockRecord = state.lockRecords.find((l) => l.id === lockId);
        if (!lockRecord) return false;

        set((s) => ({
          lockRecords: s.lockRecords.filter((l) => l.id !== lockId),
          rooms: s.rooms.map((r) =>
            r.id === lockRecord.roomId ? { ...r, status: 'available' } : r
          ),
        }));

        return true;
      },

      addOrderItem: (orderId, item) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        const newItem: OrderItem = {
          ...item,
          id: generateId('item-'),
        };

        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const newItems = [...o.items, newItem];
            const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
            return {
              ...o,
              items: newItems,
              totalAmount: total,
              actualAmount: Math.max(0, total - o.discountAmount),
              updatedAt: Date.now(),
            };
          }),
        }));

        if (order.status === 'arrived' || order.status === 'consuming') {
          const kitchenOrder = state.kitchenOrders.find(k => k.orderId === orderId);
          if (kitchenOrder) {
            state.updateKitchenOrderStatus(kitchenOrder.id, 'preparing');
          } else {
            state.createKitchenOrder(orderId, [newItem], 'normal');
          }
        }

        return true;
      },

      syncOrderItemsToKitchen: (orderId, priority: 'normal' | 'urgent' = 'normal') => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order || order.items.length === 0) return null;

        const existingKitchenOrder = state.kitchenOrders.find(k => k.orderId === orderId);
        if (existingKitchenOrder) {
          set((s) => ({
            kitchenOrders: s.kitchenOrders.map(k =>
              k.id === existingKitchenOrder.id
                ? { ...k, items: order.items, priority, updatedAt: Date.now() }
                : k
            ),
          }));
          return existingKitchenOrder;
        }

        return state.createKitchenOrder(orderId, order.items, priority);
      },

      removeOrderItem: (orderId, itemId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const newItems = o.items.filter((i) => i.id !== itemId);
            const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
            return {
              ...o,
              items: newItems,
              totalAmount: total,
              actualAmount: Math.max(0, total - o.discountAmount),
              updatedAt: Date.now(),
            };
          }),
        }));

        return true;
      },

      updateOrderItem: (orderId, itemId, updates) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const newItems = o.items.map((i) =>
              i.id === itemId ? { ...i, ...updates } : i
            );
            const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
            return {
              ...o,
              items: newItems,
              totalAmount: total,
              actualAmount: Math.max(0, total - o.discountAmount),
              updatedAt: Date.now(),
            };
          }),
        }));

        return true;
      },

      addWaitlist: (data) => {
        const state = get();
        const position =
          state.waitlist.filter((w) => w.status === 'waiting').length + 1;

        const record: WaitlistRecord = {
          ...data,
          id: generateId('wait-'),
          queuePosition: position,
          status: 'waiting',
          createdAt: Date.now(),
        };

        set((s) => ({
          waitlist: [...s.waitlist, record],
        }));

        return record;
      },

      promoteWaitlist: (waitlistId, roomId) => {
        void roomId;
        const state = get();
        const record = state.waitlist.find((w) => w.id === waitlistId);
        if (!record) return false;

        set((s) => ({
          waitlist: s.waitlist.map((w) =>
            w.id === waitlistId ? { ...w, status: 'promoted' } : w
          ),
        }));

        state.addOperationLog(record.customerId, 'waitlist_promote', '候补提升');

        return true;
      },

      cancelWaitlist: (waitlistId) => {
        set((s) => ({
          waitlist: s.waitlist.map((w) =>
            w.id === waitlistId ? { ...w, status: 'cancelled' } : w
          ),
        }));
        return true;
      },

      createApproval: (orderId, type, reason, extraData) => {
        const state = get();
        const approval: ApprovalRecord = {
          id: generateId('app-'),
          orderId,
          type,
          applicantId: state.currentUserId,
          applicantName: state.currentUserName,
          status: 'pending',
          reason,
          createdAt: Date.now(),
          extraData,
        };

        set((s) => ({
          approvalRecords: [...s.approvalRecords, approval],
        }));

        return approval;
      },

      approveApproval: (approvalId, remark) => {
        const state = get();
        const approval = state.approvalRecords.find((a) => a.id === approvalId);
        if (!approval) return false;

        if (approval.type === 'extend_reserve' && approval.extraData?.extendMinutes) {
          state.executeOrderOperation(
            approval.orderId,
            'extend_reserve',
            { extendMinutes: approval.extraData.extendMinutes as number },
            remark
          );
        }

        if (approval.type === 'abnormal_release') {
          state.executeOrderOperation(
            approval.orderId,
            'abnormal_release',
            undefined,
            remark
          );
        }

        set((s) => ({
          approvalRecords: s.approvalRecords.map((a) =>
            a.id === approvalId
              ? {
                  ...a,
                  status: 'approved',
                  approverId: s.currentUserId,
                  approverName: s.currentUserName,
                  approvalRemark: remark,
                  approvedAt: Date.now(),
                }
              : a
          ),
        }));

        return true;
      },

      rejectApproval: (approvalId, remark) => {
        set((s) => ({
          approvalRecords: s.approvalRecords.map((a) =>
            a.id === approvalId
              ? {
                  ...a,
                  status: 'rejected',
                  approverId: s.currentUserId,
                  approverName: s.currentUserName,
                  approvalRemark: remark,
                  approvedAt: Date.now(),
                }
              : a
          ),
        }));
        return true;
      },

      addFinanceRecord: (orderId, type, amount, direction, paymentMethod, remark) => {
        const state = get();
        const record: FinanceRecord = {
          id: generateId('fin-'),
          orderId,
          type,
          amount,
          direction,
          paymentMethod: paymentMethod as FinanceRecord['paymentMethod'],
          operatorId: state.currentUserId,
          operatorName: state.currentUserName,
          timestamp: Date.now(),
          remark,
        };

        set((s) => ({
          financeRecords: [...s.financeRecords, record],
        }));
      },

      addException: (type, severity, description, orderId, roomId) => {
        void get();
        const exception: ExceptionRecord = {
          id: generateId('ex-'),
          orderId,
          roomId,
          type,
          severity,
          description,
          status: 'pending',
          createdAt: Date.now(),
        };

        set((s) => ({
          exceptionRecords: [...s.exceptionRecords, exception],
        }));
      },

      resolveException: (exceptionId, resolution) => {
        set((s) => ({
          exceptionRecords: s.exceptionRecords.map((e) =>
            e.id === exceptionId
              ? {
                  ...e,
                  status: 'resolved',
                  handlerId: s.currentUserId,
                  handlerName: s.currentUserName,
                  resolution,
                  resolvedAt: Date.now(),
                }
              : e
          ),
        }));
        return true;
      },

      deriveOrderStatusFromLogs: (orderId) => {
        const state = get();
        const logs = state.operationLogs
          .filter((l) => l.orderId === orderId)
          .sort((a, b) => a.timestamp - b.timestamp);

        let derivedStatus: Order['status'] = 'pending';
        for (const log of logs) {
          const transition = stateTransitions.find(
            (t) => t.event === log.type && t.from.includes(derivedStatus)
          );
          if (transition) {
            derivedStatus = transition.to;
          }
        }
        return derivedStatus;
      },

      processExpiredOrders: () => {
        const state = get();
        const now = Date.now();

        for (const order of state.orders) {
          if (
            ['confirmed', 'min_consumption_pending'].includes(order.status) &&
            order.reserveExpireTime &&
            now > order.reserveExpireTime &&
            !order.actualArrivalTime
          ) {
            state.markNoShow(order.id);
          }

          if (
            order.status === 'locked' &&
            order.lockExpireTime &&
            now > order.lockExpireTime
          ) {
            const lockRecord = state.lockRecords.find(
              (l) => l.roomId === order.roomId && l.endTime > now - 3600000
            );
            if (lockRecord) {
              state.unlockRoom(lockRecord.id);
            }
            state.executeOrderOperation(order.id, 'unlock_room', undefined, '锁包超时自动释放');
          }
        }

        const expiredLocks = state.lockRecords.filter((l) => l.endTime < now);
        for (const lock of expiredLocks) {
          state.unlockRoom(lock.id);
        }

        const expiredWaitlist = state.waitlist.filter(
          (w) => w.status === 'waiting' && w.expireTime < now
        );
        for (const w of expiredWaitlist) {
          state.cancelWaitlist(w.id);
        }
      },

      validateLockedFields: (orderId, updates) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        const isLocked = ['arrived', 'consuming', 'completed', 'cancelled', 'no_show'].includes(order.status);
        if (!isLocked) return true;

        const lockedFields = [
          'roomId', 'roomName', 'reserveStartTime', 'reserveEndTime',
          'minConsumption', 'depositAmount', 'customerId', 'customerName',
        ];

        for (const field of lockedFields) {
          if (field in updates && (updates as unknown as Record<string, unknown>)[field] !== (order as unknown as Record<string, unknown>)[field]) {
            return false;
          }
        }

        if ('peopleCount' in updates && order.status !== 'arrived') {
          return false;
        }

        return true;
      },

      checkRoomAvailable: (roomId, startTime, endTime, excludeOrderId) => {
        const state = get();
        const room = state.rooms.find((r) => r.id === roomId);
        if (!room || room.status === 'maintenance') return false;

        const bookings = state.getRoomBookings(roomId);
        const activeOrders = bookings.filter(
          (o) =>
            o.id !== excludeOrderId &&
            ['confirmed', 'locked', 'min_consumption_pending', 'arrived', 'consuming'].includes(
              o.status
            )
        );

        for (const order of activeOrders) {
          if (
            isTimeOverlap(
              startTime,
              endTime,
              order.reserveStartTime,
              order.reserveEndTime
            )
          ) {
            return false;
          }
        }

        const activeLocks = state.lockRecords.filter(
          (l) => l.roomId === roomId && l.endTime > Date.now()
        );
        for (const lock of activeLocks) {
          if (isTimeOverlap(startTime, endTime, lock.startTime, lock.endTime)) {
            return false;
          }
        }

        return true;
      },

      getRoomBookings: (roomId) => {
        const state = get();
        return state.orders.filter((o) => o.roomId === roomId);
      },

      addOperationLog: (orderId, type, remark, beforeData, afterData) => {
        const state = get();
        const log: OperationLog = {
          id: generateId('log-'),
          orderId,
          type,
          operatorId: state.currentUserId,
          operatorName: state.currentUserName,
          operatorRole: state.currentRole,
          timestamp: Date.now(),
          remark,
          beforeData,
          afterData,
        };

        set((s) => ({
          operationLogs: [...s.operationLogs, log],
        }));
      },

      calculateOrderAmount: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return { total: 0, discount: 0, actual: 0 };

        const total = order.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        const discount = order.discountAmount || 0;
        const actual = Math.max(0, total - discount);

        return { total, discount, actual };
      },

      mergeRooms: (mainOrderId, mergedOrderIds, roomIds) => {
        const state = get();
        const mainOrder = state.orders.find((o) => o.id === mainOrderId);
        if (!mainOrder) return false;

        const mergedOrders = state.orders.filter((o) => mergedOrderIds.includes(o.id));
        if (mergedOrders.length !== mergedOrderIds.length) return false;

        const allOrders = [mainOrder, ...mergedOrders];
        const allRoomIds = [...new Set([mainOrder.roomId, ...mergedOrders.map((o) => o.roomId), ...roomIds])];
        const rooms = state.rooms.filter((r) => allRoomIds.includes(r.id));
        const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
        const totalPeople = allOrders.reduce((sum, o) => sum + o.peopleCount, 0);

        if (totalPeople > totalCapacity) {
          state.addException(
            'over_capacity',
            'high',
            `拼包总人数${totalPeople}人超过合并容量${totalCapacity}人`,
            mainOrderId
          );
          return false;
        }

        for (let i = 0; i < allOrders.length - 1; i++) {
          for (let j = i + 1; j < allOrders.length; j++) {
            if (isTimeOverlap(
              allOrders[i].reserveStartTime, allOrders[i].reserveEndTime,
              allOrders[j].reserveStartTime, allOrders[j].reserveEndTime
            )) {
              state.addException(
                'conflict',
                'high',
                `拼包订单时间段冲突: ${allOrders[i].orderNo} 与 ${allOrders[j].orderNo}`,
                mainOrderId
              );
              return false;
            }
          }
        }

        const mergeRecord: MergeRecord = {
          id: generateId('merge-'),
          mainOrderId,
          mergedOrderIds,
          roomIds: allRoomIds,
          status: 'confirmed',
          operatorId: state.currentUserId,
          createdAt: Date.now(),
        };

        set((s) => ({
          mergeRecords: [...s.mergeRecords, mergeRecord],
          orders: s.orders.map((o) =>
            o.id === mainOrderId ? { ...o, mergeId: mergeRecord.id } : o
          ),
        }));

        state.addOperationLog(mainOrderId, 'merge_room', `拼包合并: 合并${mergedOrders.length}个订单,${rooms.length}个包厢,总容量${totalCapacity}人`);

        return true;
      },

      splitRoom: (orderId, splitOrders) => {
        void splitOrders;
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        state.addOperationLog(orderId, 'split_room', '拆包');
        return true;
      },

      transferOrder: (orderId, targetRoomId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return { success: false, error: '订单不存在' };

        const targetRoom = state.rooms.find((r) => r.id === targetRoomId);
        if (!targetRoom) return { success: false, error: '目标包厢不存在' };

        if (!state.checkRoomAvailable(targetRoomId, order.reserveStartTime, order.reserveEndTime, orderId)) {
          return { success: false, error: '目标包厢时间段已被占用' };
        }

        const beforeData = { ...order };
        const updatedOrder = {
          ...order,
          roomId: targetRoomId,
          roomName: targetRoom.name,
          minConsumption: targetRoom.minConsumption,
          depositAmount: targetRoom.depositAmount,
          updatedAt: Date.now(),
        };

        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
        }));

        state.addOperationLog(
          orderId,
          'transfer_order',
          `转订至${targetRoom.name}`,
          beforeData as unknown as Record<string, unknown>,
          updatedOrder as unknown as Record<string, unknown>
        );

        return { success: true };
      },

      applyCoupon: (orderId, couponId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        const coupon = state.coupons.find((c) => c.id === couponId);
        if (!order || !coupon || coupon.isUsed) return false;

        let discount = 0;
        const { total } = state.calculateOrderAmount(orderId);
        if (coupon.minAmount && total < coupon.minAmount) return false;

        if (coupon.type === 'amount') {
          discount = coupon.value;
        } else if (coupon.type === 'discount') {
          discount = Math.floor(total * (1 - coupon.value));
        }

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  couponId: coupon.id,
                  couponDiscount: discount,
                  discountAmount: o.discountAmount + discount,
                  actualAmount: Math.max(0, o.totalAmount - o.discountAmount - discount),
                  updatedAt: Date.now(),
                }
              : o
          ),
          coupons: s.coupons.map((c) => (c.id === couponId ? { ...c, isUsed: true } : c)),
        }));

        state.addFinanceRecord(orderId, 'coupon_discount', discount, 'out', undefined, `优惠券:${coupon.name}`);
        state.addOperationLog(orderId, 'coupon_use', `使用优惠券${coupon.code}`);

        return true;
      },

      applyMemberBenefit: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        const customer = state.customers.find((c) => c.id === order.customerId);
        if (!customer || !customer.isMember) return false;

        const { total } = state.calculateOrderAmount(orderId);
        const memberDiscount = Math.floor(total * 0.1);

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  useMemberBenefit: true,
                  memberDiscount,
                  discountAmount: o.discountAmount + memberDiscount,
                  actualAmount: Math.max(0, o.totalAmount - o.discountAmount - memberDiscount),
                  updatedAt: Date.now(),
                }
              : o
          ),
        }));

        state.addFinanceRecord(orderId, 'member_discount', memberDiscount, 'out', undefined, `会员折扣`);
        state.addOperationLog(orderId, 'member_benefit', '使用会员权益');

        return true;
      },

      createInvoice: (orderId, data) => {
        const state = get();
        const invoice: InvoiceInfo = {
          ...data,
          id: generateId('inv-'),
          orderId,
          status: 'issued',
          issuedAt: Date.now(),
        };

        set((s) => ({
          invoices: [...s.invoices, invoice],
        }));

        state.addOperationLog(orderId, 'invoice_issue', `开具发票:${invoice.title}`);

        return invoice;
      },

      createSplitRecord: (orderId, payerRecords) => {
        const state = get();
        const splitRecs: SplitRecord[] = payerRecords.map((p) => ({
          id: generateId('split-'),
          orderId,
          payerId: p.payerId,
          payerName: p.payerName,
          amount: p.amount,
          status: 'pending',
        }));

        set((s) => ({
          splitRecords: [...s.splitRecords, ...splitRecs],
        }));

        state.addFinanceRecord(orderId, 'split_account', splitRecs.reduce((sum, r) => sum + r.amount, 0), 'in', undefined, '分账');
      },

      paySplitRecord: (splitId) => {
        set((s) => ({
          splitRecords: s.splitRecords.map((r) =>
            r.id === splitId ? { ...r, status: 'paid', paidAt: Date.now() } : r
          ),
        }));
        return true;
      },

      confirmArrival: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        const lateMinutes = order.reserveStartTime < Date.now()
          ? Math.floor((Date.now() - order.reserveStartTime) / 60000)
          : 0;

        if (lateMinutes > 15) {
          state.chargeLateArrival(orderId, lateMinutes);
        }

        const result = state.executeOrderOperation(orderId, 'arrive_confirm');
        if (!result.success) return false;

        state.addOperationLog(orderId, 'arrive_confirm', '顾客到店确认');
        return true;
      },

      confirmConsumption: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        const currentStatus = order.status;
        const result = state.executeOrderOperation(orderId, 'consumption_confirm');
        if (!result.success) return false;

        if (currentStatus === 'arrived') {
          state.addOperationLog(orderId, 'consumption_confirm', '开始消费');
        } else if (currentStatus === 'consuming') {
          state.addOperationLog(orderId, 'consumption_confirm', '消费完成');
          if (order.depositPaid) {
            state.deductDeposit(orderId);
          }
        }

        return true;
      },

      deductDeposit: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order || !order.depositPaid) return false;

        state.addFinanceRecord(
          orderId,
          'deposit_deduct',
          order.depositAmount,
          'out',
          'deposit',
          '定金抵扣消费'
        );
        state.addOperationLog(orderId, 'deposit_deduct', '定金抵扣');

        return true;
      },

      processRefund: (orderId, amount, reason) => {
        const state = get();
        state.addFinanceRecord(orderId, 'refund', amount, 'out', 'wechat', reason);
        return true;
      },

      reverseCharge: (orderId, financeRecordId, reason) => {
        const state = get();
        const record = state.financeRecords.find((f) => f.id === financeRecordId);
        if (!record) return false;

        state.addFinanceRecord(
          orderId,
          'reverse_charge',
          record.amount,
          record.direction === 'in' ? 'out' : 'in',
          record.paymentMethod,
          `冲正:${reason}`
        );
        state.addOperationLog(orderId, 'reverse_charge', `冲正:${reason}`);

        return true;
      },

      chargeLateArrival: (orderId, lateMinutes) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        const lateFee = Math.min(lateMinutes * 2, order.depositAmount || 100);

        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, lateMinutes, lateFee, updatedAt: Date.now() } : o
          ),
        }));

        state.addFinanceRecord(orderId, 'late_charge', lateFee, 'in', 'deposit', `迟到${lateMinutes}分钟计费`);
        state.addOperationLog(orderId, 'late_arrival_charge', `迟到${lateMinutes}分钟,计费${lateFee}元`);
        state.addException('late_arrival', 'low', `顾客迟到${lateMinutes}分钟`, orderId);

        return true;
      },

      markNoShow: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        const result = state.executeOrderOperation(orderId, 'abnormal_release');
        if (!result.success) return false;

        if (order.depositPaid) {
          state.addFinanceRecord(
            orderId,
            'no_show_charge',
            order.depositAmount,
            'in',
            'deposit',
            '爽约扣定金'
          );
        }

        state.addException('no_show', 'high', '顾客爽约未到店', orderId);
        return true;
      },

      createKitchenOrder: (orderId, items, priority = 'normal') => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return null;

        const kitchenOrder: KitchenOrder = {
          id: generateId('kitchen-'),
          orderId,
          roomId: order.roomId,
          roomName: order.roomName,
          items,
          status: 'pending',
          priority,
          createdAt: Date.now(),
          estimatedReadyTime: addMinutes(Date.now(), 30),
        };

        set((s) => ({
          kitchenOrders: [...s.kitchenOrders, kitchenOrder],
        }));

        return kitchenOrder;
      },

      updateKitchenOrderStatus: (kitchenOrderId, status) => {
        set((s) => ({
          kitchenOrders: s.kitchenOrders.map((k) =>
            k.id === kitchenOrderId ? { ...k, status } : k
          ),
        }));
        return true;
      },

      // 库存管理
      lockStock: (orderId, menuItemId, quantity, reason) => {
        const state = get();
        const stock = state.menuItemStocks.find((s) => s.menuItemId === menuItemId);
        if (!stock || !stock.isStockManaged) return true;
        if (stock.availableStock < quantity) {
          state.addException(
            'system_error',
            'medium',
            `${stock.name}库存不足，需要${quantity}${stock.unit}，仅剩${stock.availableStock}${stock.unit}`,
            orderId
          );
          return false;
        }

        const lockRecord: StockLockRecord = {
          id: generateId('stock-lock-'),
          orderId,
          menuItemId,
          menuItemName: stock.name,
          quantity,
          status: 'locked',
          lockedAt: Date.now(),
          reason,
        };

        set((s) => ({
          menuItemStocks: s.menuItemStocks.map((st) =>
            st.menuItemId === menuItemId
              ? {
                  ...st,
                  lockedStock: st.lockedStock + quantity,
                  availableStock: st.availableStock - quantity,
                }
              : st
          ),
          stockLockRecords: [...s.stockLockRecords, lockRecord],
        }));

        return true;
      },

      releaseStock: (orderId, menuItemId, reason) => {
        const state = get();
        const lockRecords = state.stockLockRecords.filter(
          (l) => l.orderId === orderId && l.menuItemId === menuItemId && l.status === 'locked'
        );
        if (lockRecords.length === 0) return false;

        const totalQuantity = lockRecords.reduce((sum, r) => sum + r.quantity, 0);

        set((s) => ({
          menuItemStocks: s.menuItemStocks.map((st) =>
            st.menuItemId === menuItemId
              ? {
                  ...st,
                  lockedStock: Math.max(0, st.lockedStock - totalQuantity),
                  availableStock: st.availableStock + totalQuantity,
                }
              : st
          ),
          stockLockRecords: s.stockLockRecords.map((l) =>
            l.orderId === orderId && l.menuItemId === menuItemId && l.status === 'locked'
              ? { ...l, status: 'released', releasedAt: Date.now(), reason: `${l.reason} - ${reason}` }
              : l
          ),
        }));

        return true;
      },

      releaseAllStockForOrder: (orderId, reason) => {
        const state = get();
        const lockRecords = state.stockLockRecords.filter(
          (l) => l.orderId === orderId && l.status === 'locked'
        );

        const stockChanges: Record<string, number> = {};
        lockRecords.forEach((r) => {
          stockChanges[r.menuItemId] = (stockChanges[r.menuItemId] || 0) + r.quantity;
        });

        set((s) => ({
          menuItemStocks: s.menuItemStocks.map((st) => {
            const qty = stockChanges[st.menuItemId] || 0;
            if (qty === 0) return st;
            return {
              ...st,
              lockedStock: Math.max(0, st.lockedStock - qty),
              availableStock: st.availableStock + qty,
            };
          }),
          stockLockRecords: s.stockLockRecords.map((l) =>
            l.orderId === orderId && l.status === 'locked'
              ? { ...l, status: 'released', releasedAt: Date.now(), reason: `${l.reason} - ${reason}` }
              : l
          ),
        }));
      },

      consumeStock: (orderId, menuItemId, quantity) => {
        const state = get();
        const lockRecords = state.stockLockRecords.filter(
          (l) => l.orderId === orderId && l.menuItemId === menuItemId && l.status === 'locked'
        );

        set((s) => ({
          menuItemStocks: s.menuItemStocks.map((st) =>
            st.menuItemId === menuItemId
              ? {
                  ...st,
                  totalStock: Math.max(0, st.totalStock - quantity),
                  lockedStock: Math.max(0, st.lockedStock - quantity),
                }
              : st
          ),
          stockLockRecords: s.stockLockRecords.map((l) =>
            l.orderId === orderId && l.menuItemId === menuItemId && l.status === 'locked'
              ? { ...l, status: 'consumed' }
              : l
          ),
        }));

        return true;
      },

      checkStockAvailable: (menuItemId, quantity) => {
        const state = get();
        const stock = state.menuItemStocks.find((s) => s.menuItemId === menuItemId);
        if (!stock) return false;
        if (!stock.isStockManaged) return true;
        return stock.availableStock >= quantity;
      },

      // 高峰保留
      createPeakHourReservation: (data) => {
        const state = get();
        const reservation: PeakHourReservation = {
          ...data,
          id: generateId('peak-'),
          createdBy: state.currentUserId,
          createdAt: Date.now(),
        };

        set((s) => ({
          peakHourReservations: [...s.peakHourReservations, reservation],
        }));

        return reservation;
      },

      togglePeakHourReservation: (reservationId) => {
        set((s) => ({
          peakHourReservations: s.peakHourReservations.map((r) =>
            r.id === reservationId ? { ...r, isActive: !r.isActive } : r
          ),
        }));
        return true;
      },

      deletePeakHourReservation: (reservationId) => {
        set((s) => ({
          peakHourReservations: s.peakHourReservations.filter((r) => r.id !== reservationId),
        }));
        return true;
      },

      // 从流水推导金额
      deriveOrderAmountFromFinance: (orderId) => {
        const state = get();
        const records = state.financeRecords.filter((r) => r.orderId === orderId);

        let totalIncome = 0;
        let totalExpense = 0;
        let depositPaid = 0;
        let depositRefunded = 0;
        let consumption = 0;
        let discount = 0;
        let lateFee = 0;
        let cancelFee = 0;
        let noShowFee = 0;

        records.forEach((record) => {
          if (record.direction === 'in') {
            totalIncome += record.amount;
          } else {
            totalExpense += record.amount;
          }

          switch (record.type) {
            case 'deposit_pay':
              depositPaid += record.amount;
              break;
            case 'deposit_refund':
              depositRefunded += record.amount;
              break;
            case 'consumption':
              consumption += record.amount;
              break;
            case 'coupon_discount':
            case 'member_discount':
              discount += record.amount;
              break;
            case 'late_charge':
              lateFee += record.amount;
              break;
            case 'cancel_charge':
              cancelFee += record.amount;
              break;
            case 'no_show_charge':
              noShowFee += record.amount;
              break;
          }
        });

        const balance = totalIncome - totalExpense;

        return {
          totalIncome,
          totalExpense,
          balance,
          depositPaid,
          depositRefunded,
          consumption,
          discount,
          lateFee,
          cancelFee,
          noShowFee,
        };
      },

      // 计算操作影响（三维时间轴）
      getOperationImpacts: (orderId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return [];

        const logs = state.operationLogs
          .filter((l) => l.orderId === orderId)
          .sort((a, b) => a.timestamp - b.timestamp);

        const room = state.rooms.find((r) => r.id === order.roomId);
        const stockLocks = state.stockLockRecords.filter((l) => l.orderId === orderId);

        let runningCapacity = room ? room.capacity : 0;
        let runningPrepTime = 0;
        let runningBalance = 0;

        const impacts: OperationImpact[] = logs.map((log) => {
          let capacityChange = 0;
          let prepTimeChange = 0;
          let amountChange = 0;
          let direction: 'in' | 'out' | 'neutral' = 'neutral';

          // 包厢容量影响
          if (log.type === 'create_order' || log.type === 'transfer_order') {
            capacityChange = -order.peopleCount;
          } else if (log.type === 'cancel_order' || log.type === 'abnormal_release') {
            capacityChange = order.peopleCount;
          } else if (log.type === 'update_people' && log.beforeData && log.afterData) {
            const before = (log.beforeData as { peopleCount: number }).peopleCount || 0;
            const after = (log.afterData as { peopleCount: number }).peopleCount || 0;
            capacityChange = before - after;
          } else if (log.type === 'arrive_confirm') {
            capacityChange = 0;
          } else if (log.type === 'consumption_confirm' && log.beforeData) {
            const beforeStatus = (log.beforeData as { status: string }).status;
            if (beforeStatus === 'consuming') {
              capacityChange = order.peopleCount;
            }
          }

          runningCapacity += capacityChange;

          // 厨房备餐影响
          const itemLocks = stockLocks.filter((l) => l.lockedAt <= log.timestamp + 1000);
          const totalPrepTime = itemLocks.reduce((sum, lock) => {
            const stockItem = state.menuItemStocks.find((s) => s.menuItemId === lock.menuItemId);
            return sum + (stockItem?.prepTimeMinutes || 15) * lock.quantity;
          }, 0);
          prepTimeChange = totalPrepTime - runningPrepTime;
          runningPrepTime = totalPrepTime;

          // 收银余额影响
          const financeRecords = state.financeRecords.filter(
            (f) => f.orderId === orderId && f.timestamp <= log.timestamp + 1000
          );
          const totalIn = financeRecords.filter((f) => f.direction === 'in').reduce((sum, f) => sum + f.amount, 0);
          const totalOut = financeRecords.filter((f) => f.direction === 'out').reduce((sum, f) => sum + f.amount, 0);
          const newBalance = totalIn - totalOut;
          amountChange = newBalance - runningBalance;
          runningBalance = newBalance;

          if (amountChange > 0) direction = 'in';
          else if (amountChange < 0) direction = 'out';

          return {
            operationLogId: log.id,
            orderId,
            timestamp: log.timestamp,
            operationType: log.type,
            operatorName: log.operatorName,
            operatorRole: log.operatorRole,
            remark: log.remark,
            roomImpact: {
              roomId: order.roomId,
              roomName: order.roomName,
              capacityChange,
              capacityAfter: runningCapacity,
            },
            kitchenImpact: {
              prepTimeChange,
              totalPrepTimeAfter: runningPrepTime,
            },
            financeImpact: {
              amountChange: Math.abs(amountChange),
              balanceAfter: runningBalance,
              direction,
            },
          } as OperationImpact;
        });

        return impacts;
      },

      // 预点单管理
      addPreOrderItem: (orderId, item) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        if (!state.checkStockAvailable(item.menuItemId, item.quantity)) {
          return false;
        }

        const success = state.addOrderItem(orderId, item);
        if (!success) return false;

        state.lockStock(orderId, item.menuItemId, item.quantity, '预点单锁定');

        return true;
      },

      removePreOrderItem: (orderId, itemId) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        const item = order.items.find((i) => i.id === itemId);
        if (item) {
          state.releaseStock(orderId, item.menuItemId, '取消预点单');
        }

        return state.removeOrderItem(orderId, itemId);
      },

      updatePreOrderItem: (orderId, itemId, updates) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return false;

        const item = order.items.find((i) => i.id === itemId);
        if (!item) return false;

        if (updates.quantity && updates.quantity !== item.quantity) {
          const diff = updates.quantity - item.quantity;
          if (diff > 0) {
            if (!state.checkStockAvailable(item.menuItemId, diff)) {
              return false;
            }
            state.lockStock(orderId, item.menuItemId, diff, '预点单加量');
          } else {
            state.releaseStock(orderId, item.menuItemId, '预点单减量');
          }
        }

        return state.updateOrderItem(orderId, itemId, updates);
      },

      // 备餐时间计算
      calculatePrepTime: (items) => {
        const state = get();
        let totalTime = 0;

        items.forEach((item) => {
          const stock = state.menuItemStocks.find((s) => s.menuItemId === item.menuItemId);
          if (stock) {
            totalTime = Math.max(totalTime, stock.prepTimeMinutes * item.quantity);
          } else {
            totalTime = Math.max(totalTime, 20 * item.quantity);
          }
        });

        return Math.max(10, totalTime);
      },

      resetAllData: () => {
        set({
          rooms: mockRooms,
          orders: mockOrders,
          customers: mockCustomers,
          lockRecords: mockLockRecords,
          waitlist: mockWaitlist,
          kitchenOrders: mockKitchenOrders,
          coupons: mockCoupons,
          operationLogs: mockOperationLogs,
          financeRecords: mockFinanceRecords,
          exceptionRecords: mockExceptionRecords,
          approvalRecords: mockApprovalRecords,
          mergeRecords: [],
          splitRecords: [],
          staffShifts: mockStaffShifts,
          invoices: [],
          menuItemStocks: mockMenuItemStocks,
          stockLockRecords: mockStockLockRecords,
          peakHourReservations: mockPeakHourReservations,
        });
      },
    }),
    {
      name: 'restaurant-booking-store',
    }
  )
);
