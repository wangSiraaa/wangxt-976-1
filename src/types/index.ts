// 角色类型
export type RoleType = 'reception' | 'customer' | 'manager' | 'cashier';

// 包厢状态
export type RoomStatus = 'available' | 'locked' | 'reserved' | 'occupied' | 'maintenance';

// 订单状态
export type OrderStatus =
  | 'pending'         // 待确认
  | 'confirmed'       // 已确认（已付定金）
  | 'locked'          // 锁包中
  | 'min_consumption_pending' // 最低消费待确认
  | 'arrived'         // 已到店
  | 'consuming'       // 消费中
  | 'completed'       // 已完成
  | 'cancelled'       // 已取消
  | 'no_show'         // 爽约
  | 'expired';        // 已过期

// 操作流水类型
export type OperationType =
  | 'create_order'
  | 'update_people'
  | 'pay_deposit'
  | 'cancel_order'
  | 'lock_room'
  | 'unlock_room'
  | 'confirm_min_consumption'
  | 'extend_reserve'
  | 'abnormal_release'
  | 'arrive_confirm'
  | 'consumption_confirm'
  | 'deposit_deduct'
  | 'refund'
  | 'reverse_charge'
  | 'merge_room'
  | 'split_room'
  | 'transfer_order'
  | 'waitlist_join'
  | 'waitlist_promote'
  | 'late_arrival_charge'
  | 'coupon_use'
  | 'invoice_issue'
  | 'member_benefit';

// 账务类型
export type FinanceType =
  | 'deposit_pay'       // 定金支付
  | 'deposit_deduct'    // 定金抵扣
  | 'deposit_refund'    // 定金退还
  | 'consumption'       // 消费金额
  | 'no_show_charge'    // 爽约扣款
  | 'cancel_charge'     // 取消扣款
  | 'late_charge'       // 迟到计费
  | 'coupon_discount'   // 优惠券抵扣
  | 'member_discount'   // 会员折扣
  | 'refund'            // 退款
  | 'reverse_charge'    // 冲正
  | 'split_account';    // 分账

// 桌型
export type TableType = 'round' | 'square' | 'rectangle' | 'private';

// 包厢信息
export interface Room {
  id: string;
  name: string;
  roomNo: string;
  tableType: TableType;
  capacity: number;
  minConsumption: number;
  depositAmount: number;
  status: RoomStatus;
  bookableSlots: TimeSlot[];
  floor: number;
  area: string;
  description?: string;
  facilities: string[];
  images: string[];
}

// 可订时段
export interface TimeSlot {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  weekday: number[]; // 0-6
}

// 锁包记录
export interface LockRecord {
  id: string;
  roomId: string;
  orderId?: string;
  startTime: number;  // timestamp
  endTime: number;    // timestamp
  reason: string;
  operatorId: string;
  operatorName: string;
  createdAt: number;
}

// 顾客信息
export interface Customer {
  id: string;
  name: string;
  phone: string;
  memberLevel?: string;
  memberPoints?: number;
  isMember: boolean;
}

// 订单项
export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  isSetMeal?: boolean;
  remark?: string;
}

// 候补记录
export interface WaitlistRecord {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  peopleCount: number;
  roomTypePreference?: string;
  targetTime: number;
  status: 'waiting' | 'promoted' | 'cancelled' | 'completed';
  queuePosition: number;
  createdAt: number;
  expireTime: number;
}

// 拼包记录
export interface MergeRecord {
  id: string;
  mainOrderId: string;
  mergedOrderIds: string[];
  roomIds: string[];
  status: 'pending' | 'confirmed' | 'cancelled';
  operatorId: string;
  createdAt: number;
}

// 服务员排班
export interface StaffShift {
  id: string;
  staffId: string;
  staffName: string;
  roomIds: string[];
  date: string; // YYYY-MM-DD
  shiftType: 'morning' | 'afternoon' | 'evening' | 'night';
  startTime: string;
  endTime: string;
}

// 优惠券
export interface Coupon {
  id: string;
  code: string;
  name: string;
  type: 'discount' | 'amount' | 'free';
  value: number;
  minAmount?: number;
  expireTime?: number;
  applicableRooms?: string[];
  isUsed: boolean;
}

// 发票信息
export interface InvoiceInfo {
  id: string;
  orderId: string;
  type: 'personal' | 'company';
  title: string;
  taxNumber?: string;
  amount: number;
  status: 'pending' | 'issued' | 'failed';
  issuedAt?: number;
}

// 分账记录
export interface SplitRecord {
  id: string;
  orderId: string;
  payerId: string;
  payerName: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: number;
}

// 操作流水
export interface OperationLog {
  id: string;
  orderId: string;
  type: OperationType;
  operatorId: string;
  operatorName: string;
  operatorRole: RoleType;
  timestamp: number;
  remark?: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
}

// 账务流水
export interface FinanceRecord {
  id: string;
  orderId: string;
  type: FinanceType;
  amount: number;
  direction: 'in' | 'out';
  paymentMethod?: 'cash' | 'wechat' | 'alipay' | 'card' | 'deposit';
  operatorId?: string;
  operatorName?: string;
  timestamp: number;
  remark?: string;
  relatedRecordId?: string;
}

// 审批记录
export interface ApprovalRecord {
  id: string;
  orderId: string;
  type: 'extend_reserve' | 'abnormal_release' | 'min_consumption_waive';
  applicantId: string;
  applicantName: string;
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  approvalRemark?: string;
  createdAt: number;
  approvedAt?: number;
  extraData?: Record<string, unknown>;
}

// 异常记录
export interface ExceptionRecord {
  id: string;
  orderId?: string;
  roomId?: string;
  type: 'no_show' | 'late_arrival' | 'over_capacity' | 'conflict' | 'payment_failed' | 'system_error';
  severity: 'low' | 'medium' | 'high';
  description: string;
  status: 'pending' | 'handling' | 'resolved';
  handlerId?: string;
  handlerName?: string;
  createdAt: number;
  resolvedAt?: number;
  resolution?: string;
}

// 厨房备餐
export interface KitchenOrder {
  id: string;
  orderId: string;
  roomId: string;
  roomName: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served';
  priority: 'normal' | 'urgent';
  createdAt: number;
  estimatedReadyTime?: number;
}

// 订单主表
export interface Order {
  id: string;
  orderNo: string;
  roomId: string;
  roomName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  peopleCount: number;
  reserveStartTime: number;
  reserveEndTime: number;
  actualArrivalTime?: number;
  actualLeaveTime?: number;
  minConsumption: number;
  depositAmount: number;
  depositPaid: boolean;
  depositPaidAt?: number;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  actualAmount: number;
  couponId?: string;
  couponDiscount?: number;
  memberDiscount?: number;
  useMemberBenefit: boolean;
  lockExpireTime?: number;
  reserveExpireTime?: number;
  extendCount: number;
  isMinConsumptionConfirmed: boolean;
  remark?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  source: 'reception' | 'customer' | 'phone' | 'online';
  transferFromOrderId?: string;
  mergeId?: string;
  lateMinutes?: number;
  lateFee?: number;
}

// 状态机事件
export interface StateEvent {
  type: OperationType;
  payload?: Record<string, unknown>;
  operatorId: string;
  operatorName: string;
  operatorRole: RoleType;
}

// 状态转换
export interface StateTransition {
  from: OrderStatus[];
  to: OrderStatus;
  event: OperationType;
  condition?: (order: Order, payload?: Record<string, unknown>) => boolean;
  action?: (order: Order, payload?: Record<string, unknown>) => Partial<Order>;
}
