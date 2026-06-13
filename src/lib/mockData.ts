import type {
  Room,
  Order,
  OrderItem,
  Customer,
  LockRecord,
  WaitlistRecord,
  KitchenOrder,
  Coupon,
  StaffShift,
  OperationLog,
  FinanceRecord,
  ExceptionRecord,
  ApprovalRecord,
  MenuItemStock,
  StockLockRecord,
  PeakHourReservation,
  PrepTimelineNode,
} from '../types';
import { addMinutes } from './utils';

const now = Date.now();

export const mockRooms: Room[] = [
  {
    id: 'room-001',
    name: '牡丹厅',
    roomNo: 'A101',
    tableType: 'round',
    capacity: 10,
    minConsumption: 800,
    depositAmount: 200,
    status: 'available',
    bookableSlots: [
      { startTime: '11:00', endTime: '14:00', weekday: [0, 1, 2, 3, 4, 5, 6] },
      { startTime: '17:00', endTime: '22:00', weekday: [0, 1, 2, 3, 4, 5, 6] },
    ],
    floor: 1,
    area: 'A区',
    description: '豪华大包厢，配备独立卫生间和休息区',
    facilities: ['独立卫生间', '休息沙发', '电视', '音响', '茶台'],
    images: [],
  },
  {
    id: 'room-002',
    name: '梅花厅',
    roomNo: 'A102',
    tableType: 'round',
    capacity: 8,
    minConsumption: 600,
    depositAmount: 150,
    status: 'available',
    bookableSlots: [
      { startTime: '11:00', endTime: '14:00', weekday: [0, 1, 2, 3, 4, 5, 6] },
      { startTime: '17:00', endTime: '22:00', weekday: [0, 1, 2, 3, 4, 5, 6] },
    ],
    floor: 1,
    area: 'A区',
    description: '中包厢，适合家庭聚餐',
    facilities: ['电视', '音响', '茶台'],
    images: [],
  },
  {
    id: 'room-003',
    name: '兰花厅',
    roomNo: 'A201',
    tableType: 'round',
    capacity: 12,
    minConsumption: 1200,
    depositAmount: 300,
    status: 'available',
    bookableSlots: [
      { startTime: '11:00', endTime: '14:30', weekday: [0, 1, 2, 3, 4, 5, 6] },
      { startTime: '17:00', endTime: '22:30', weekday: [0, 1, 2, 3, 4, 5, 6] },
    ],
    floor: 2,
    area: 'A区',
    description: '豪华VIP包厢，全景落地窗',
    facilities: ['独立卫生间', '休息沙发', '电视', '音响', '茶台', '观景阳台'],
    images: [],
  },
  {
    id: 'room-004',
    name: '竹韵厅',
    roomNo: 'B101',
    tableType: 'rectangle',
    capacity: 6,
    minConsumption: 400,
    depositAmount: 100,
    status: 'available',
    bookableSlots: [
      { startTime: '11:00', endTime: '14:00', weekday: [0, 1, 2, 3, 4, 5, 6] },
      { startTime: '17:00', endTime: '21:00', weekday: [0, 1, 2, 3, 4, 5, 6] },
    ],
    floor: 1,
    area: 'B区',
    description: '小包厢，商务洽谈首选',
    facilities: ['电视', '茶台'],
    images: [],
  },
  {
    id: 'room-005',
    name: '菊香厅',
    roomNo: 'B102',
    tableType: 'square',
    capacity: 4,
    minConsumption: 300,
    depositAmount: 80,
    status: 'available',
    bookableSlots: [
      { startTime: '11:00', endTime: '14:00', weekday: [0, 1, 2, 3, 4, 5, 6] },
      { startTime: '17:00', endTime: '21:00', weekday: [0, 1, 2, 3, 4, 5, 6] },
    ],
    floor: 1,
    area: 'B区',
    description: '精致小包厢，情侣约会',
    facilities: ['电视'],
    images: [],
  },
  {
    id: 'room-006',
    name: 'VIP总统套房',
    roomNo: 'V301',
    tableType: 'private',
    capacity: 20,
    minConsumption: 3000,
    depositAmount: 800,
    status: 'maintenance',
    bookableSlots: [
      { startTime: '11:00', endTime: '15:00', weekday: [0, 1, 2, 3, 4, 5, 6] },
      { startTime: '17:00', endTime: '23:00', weekday: [0, 1, 2, 3, 4, 5, 6] },
    ],
    floor: 3,
    area: 'V区',
    description: '顶级VIP包厢，配备专业服务人员',
    facilities: ['独立卫生间', '休息区', 'KTV', '电视', '音响', '茶台', '雪茄吧'],
    images: [],
  },
];

export const mockMenuItems: Omit<OrderItem, 'id' | 'quantity' | 'remark'>[] = [
  { menuItemId: 'm001', name: '北京烤鸭', price: 198, category: '招牌菜', isSetMeal: false },
  { menuItemId: 'm002', name: '佛跳墙', price: 298, category: '招牌菜', isSetMeal: false },
  { menuItemId: 'm003', name: '清蒸石斑鱼', price: 168, category: '海鲜', isSetMeal: false },
  { menuItemId: 'm004', name: '蒜蓉粉丝蒸扇贝', price: 88, category: '海鲜', isSetMeal: false },
  { menuItemId: 'm005', name: '红烧肉', price: 68, category: '家常菜', isSetMeal: false },
  { menuItemId: 'm006', name: '宫保鸡丁', price: 48, category: '家常菜', isSetMeal: false },
  { menuItemId: 'm007', name: '麻婆豆腐', price: 38, category: '家常菜', isSetMeal: false },
  { menuItemId: 'm008', name: '时蔬拼盘', price: 58, category: '素菜', isSetMeal: false },
  { menuItemId: 'm009', name: '松茸汤', price: 128, category: '汤类', isSetMeal: false },
  { menuItemId: 'm010', name: '商务套餐A', price: 398, category: '套餐', isSetMeal: true },
  { menuItemId: 'm011', name: '家庭套餐B', price: 598, category: '套餐', isSetMeal: true },
  { menuItemId: 'm012', name: '茅台飞天', price: 2888, category: '酒水', isSetMeal: false },
  { menuItemId: 'm013', name: '五粮液', price: 1288, category: '酒水', isSetMeal: false },
  { menuItemId: 'm014', name: '鲜榨果汁', price: 38, category: '饮品', isSetMeal: false },
  { menuItemId: 'm015', name: '水果拼盘', price: 68, category: '果盘', isSetMeal: false },
];

export const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: '张三',
    phone: '13800138001',
    memberLevel: '黄金会员',
    memberPoints: 5800,
    isMember: true,
  },
  {
    id: 'cust-002',
    name: '李四',
    phone: '13800138002',
    memberLevel: '钻石会员',
    memberPoints: 12800,
    isMember: true,
  },
  {
    id: 'cust-003',
    name: '王五',
    phone: '13800138003',
    isMember: false,
  },
];

export const mockOrders: Order[] = [
  {
    id: 'order-001',
    orderNo: 'BX20240115001',
    roomId: 'room-001',
    roomName: '牡丹厅',
    customerId: 'cust-001',
    customerName: '张三',
    customerPhone: '13800138001',
    peopleCount: 8,
    reserveStartTime: addMinutes(now, 30),
    reserveEndTime: addMinutes(now, 180),
    minConsumption: 800,
    depositAmount: 200,
    depositPaid: true,
    depositPaidAt: addMinutes(now, -120),
    status: 'confirmed',
    items: [],
    totalAmount: 0,
    discountAmount: 0,
    actualAmount: 0,
    useMemberBenefit: false,
    reserveExpireTime: addMinutes(now, 10),
    extendCount: 0,
    isMinConsumptionConfirmed: true,
    remark: '生日宴，需要布置',
    createdAt: addMinutes(now, -120),
    updatedAt: addMinutes(now, -120),
    createdBy: 'reception-001',
    source: 'phone',
  },
  {
    id: 'order-002',
    orderNo: 'BX20240115002',
    roomId: 'room-002',
    roomName: '梅花厅',
    customerId: 'cust-002',
    customerName: '李四',
    customerPhone: '13800138002',
    peopleCount: 6,
    reserveStartTime: addMinutes(now, -30),
    reserveEndTime: addMinutes(now, 120),
    minConsumption: 600,
    depositAmount: 150,
    depositPaid: true,
    depositPaidAt: addMinutes(now, -180),
    status: 'consuming',
    items: [
      { id: 'item-001', menuItemId: 'm001', name: '北京烤鸭', price: 198, quantity: 1, category: '招牌菜' },
      { id: 'item-002', menuItemId: 'm005', name: '红烧肉', price: 68, quantity: 1, category: '家常菜' },
      { id: 'item-003', menuItemId: 'm014', name: '鲜榨果汁', price: 38, quantity: 2, category: '饮品' },
    ],
    totalAmount: 342,
    discountAmount: 34.2,
    actualAmount: 307.8,
    useMemberBenefit: true,
    memberDiscount: 34.2,
    actualArrivalTime: addMinutes(now, -20),
    extendCount: 0,
    isMinConsumptionConfirmed: true,
    createdAt: addMinutes(now, -180),
    updatedAt: addMinutes(now, -20),
    createdBy: 'reception-001',
    source: 'online',
  },
  {
    id: 'order-003',
    orderNo: 'BX20240115003',
    roomId: 'room-003',
    roomName: '兰花厅',
    customerId: 'cust-003',
    customerName: '王五',
    customerPhone: '13800138003',
    peopleCount: 10,
    reserveStartTime: addMinutes(now, 60),
    reserveEndTime: addMinutes(now, 240),
    minConsumption: 1200,
    depositAmount: 300,
    depositPaid: false,
    status: 'pending',
    items: [],
    totalAmount: 0,
    discountAmount: 0,
    actualAmount: 0,
    useMemberBenefit: false,
    extendCount: 0,
    isMinConsumptionConfirmed: false,
    createdAt: addMinutes(now, -10),
    updatedAt: addMinutes(now, -10),
    createdBy: 'customer-003',
    source: 'customer',
  },
];

export const mockLockRecords: LockRecord[] = [
  {
    id: 'lock-001',
    roomId: 'room-004',
    startTime: addMinutes(now, -5),
    endTime: addMinutes(now, 10),
    reason: '顾客电话预订确认中',
    operatorId: 'reception-001',
    operatorName: '前台小王',
    createdAt: addMinutes(now, -5),
  },
];

export const mockWaitlist: WaitlistRecord[] = [
  {
    id: 'wait-001',
    customerId: 'cust-003',
    customerName: '王五',
    phone: '13800138003',
    peopleCount: 4,
    roomTypePreference: '小包',
    targetTime: now,
    status: 'waiting',
    queuePosition: 1,
    createdAt: addMinutes(now, -15),
    expireTime: addMinutes(now, 45),
  },
];

export const mockKitchenOrders: KitchenOrder[] = [
  {
    id: 'kitchen-001',
    orderId: 'order-002',
    roomId: 'room-002',
    roomName: '梅花厅',
    items: [
      { id: 'kitem-001', menuItemId: 'm001', name: '北京烤鸭', price: 198, quantity: 1, category: '招牌菜' },
    ],
    status: 'preparing',
    priority: 'normal',
    createdAt: addMinutes(now, -15),
    estimatedReadyTime: addMinutes(now, 20),
  },
];

export const mockCoupons: Coupon[] = [
  {
    id: 'coupon-001',
    code: 'VIP888',
    name: '新客立减券',
    type: 'amount',
    value: 50,
    minAmount: 300,
    expireTime: addMinutes(now, 30 * 24 * 60),
    isUsed: false,
  },
  {
    id: 'coupon-002',
    code: 'SUMMER20',
    name: '夏季特惠8折券',
    type: 'discount',
    value: 0.8,
    minAmount: 500,
    expireTime: addMinutes(now, 60 * 24 * 60),
    isUsed: false,
  },
];

export const mockStaffShifts: StaffShift[] = [
  {
    id: 'shift-001',
    staffId: 'staff-001',
    staffName: '服务员小李',
    roomIds: ['room-001', 'room-002'],
    date: new Date().toISOString().split('T')[0],
    shiftType: 'evening',
    startTime: '17:00',
    endTime: '22:00',
  },
  {
    id: 'shift-002',
    staffId: 'staff-002',
    staffName: '服务员小王',
    roomIds: ['room-003', 'room-004', 'room-005'],
    date: new Date().toISOString().split('T')[0],
    shiftType: 'evening',
    startTime: '17:00',
    endTime: '22:00',
  },
];

export const mockOperationLogs: OperationLog[] = [
  {
    id: 'log-001',
    orderId: 'order-001',
    type: 'create_order',
    operatorId: 'reception-001',
    operatorName: '前台小王',
    operatorRole: 'reception',
    timestamp: addMinutes(now, -120),
    remark: '电话预订',
  },
  {
    id: 'log-002',
    orderId: 'order-001',
    type: 'pay_deposit',
    operatorId: 'cashier-001',
    operatorName: '收银小李',
    operatorRole: 'cashier',
    timestamp: addMinutes(now, -120),
    remark: '微信支付定金200元',
  },
];

export const mockFinanceRecords: FinanceRecord[] = [
  {
    id: 'fin-001',
    orderId: 'order-001',
    type: 'deposit_pay',
    amount: 200,
    direction: 'in',
    paymentMethod: 'wechat',
    operatorId: 'cashier-001',
    operatorName: '收银小李',
    timestamp: addMinutes(now, -120),
    remark: '定金支付',
  },
  {
    id: 'fin-002',
    orderId: 'order-002',
    type: 'deposit_pay',
    amount: 150,
    direction: 'in',
    paymentMethod: 'alipay',
    operatorId: 'cashier-001',
    operatorName: '收银小李',
    timestamp: addMinutes(now, -180),
    remark: '定金支付',
  },
];

export const mockExceptionRecords: ExceptionRecord[] = [
  {
    id: 'ex-001',
    orderId: 'order-003',
    type: 'payment_failed',
    severity: 'medium',
    description: '顾客提交预订后定金支付失败',
    status: 'pending',
    createdAt: addMinutes(now, -8),
  },
];

export const mockApprovalRecords: ApprovalRecord[] = [
  {
    id: 'app-001',
    orderId: 'order-001',
    type: 'extend_reserve',
    applicantId: 'reception-001',
    applicantName: '前台小王',
    status: 'pending',
    reason: '顾客路上堵车，要求延长保留30分钟',
    createdAt: addMinutes(now, -5),
    extraData: { extendMinutes: 30 },
  },
];

export const mockMenuItemStocks: MenuItemStock[] = [
  { menuItemId: 'm001', name: '北京烤鸭', category: '招牌菜', totalStock: 20, lockedStock: 5, availableStock: 15, unit: '份', warningThreshold: 5, prepTimeMinutes: 45, isStockManaged: true },
  { menuItemId: 'm002', name: '佛跳墙', category: '招牌菜', totalStock: 10, lockedStock: 3, availableStock: 7, unit: '份', warningThreshold: 3, prepTimeMinutes: 60, isStockManaged: true },
  { menuItemId: 'm003', name: '清蒸石斑鱼', category: '海鲜', totalStock: 8, lockedStock: 2, availableStock: 6, unit: '条', warningThreshold: 2, prepTimeMinutes: 25, isStockManaged: true },
  { menuItemId: 'm004', name: '蒜蓉粉丝蒸扇贝', category: '海鲜', totalStock: 50, lockedStock: 10, availableStock: 40, unit: '只', warningThreshold: 10, prepTimeMinutes: 20, isStockManaged: true },
  { menuItemId: 'm005', name: '红烧肉', category: '家常菜', totalStock: 30, lockedStock: 8, availableStock: 22, unit: '份', warningThreshold: 5, prepTimeMinutes: 40, isStockManaged: true },
  { menuItemId: 'm006', name: '宫保鸡丁', category: '家常菜', totalStock: 40, lockedStock: 6, availableStock: 34, unit: '份', warningThreshold: 8, prepTimeMinutes: 15, isStockManaged: true },
  { menuItemId: 'm007', name: '麻婆豆腐', category: '家常菜', totalStock: 50, lockedStock: 4, availableStock: 46, unit: '份', warningThreshold: 10, prepTimeMinutes: 12, isStockManaged: true },
  { menuItemId: 'm008', name: '时蔬拼盘', category: '素菜', totalStock: 25, lockedStock: 3, availableStock: 22, unit: '份', warningThreshold: 5, prepTimeMinutes: 10, isStockManaged: true },
  { menuItemId: 'm009', name: '松茸汤', category: '汤类', totalStock: 15, lockedStock: 4, availableStock: 11, unit: '份', warningThreshold: 3, prepTimeMinutes: 30, isStockManaged: true },
  { menuItemId: 'm010', name: '商务套餐A', category: '套餐', totalStock: 999, lockedStock: 0, availableStock: 999, unit: '份', warningThreshold: 0, prepTimeMinutes: 35, isStockManaged: false },
  { menuItemId: 'm011', name: '家庭套餐B', category: '套餐', totalStock: 999, lockedStock: 0, availableStock: 999, unit: '份', warningThreshold: 0, prepTimeMinutes: 45, isStockManaged: false },
  { menuItemId: 'm012', name: '茅台飞天', category: '酒水', totalStock: 5, lockedStock: 1, availableStock: 4, unit: '瓶', warningThreshold: 1, prepTimeMinutes: 2, isStockManaged: true },
  { menuItemId: 'm013', name: '五粮液', category: '酒水', totalStock: 8, lockedStock: 0, availableStock: 8, unit: '瓶', warningThreshold: 2, prepTimeMinutes: 2, isStockManaged: true },
  { menuItemId: 'm014', name: '鲜榨果汁', category: '饮品', totalStock: 999, lockedStock: 0, availableStock: 999, unit: '杯', warningThreshold: 0, prepTimeMinutes: 5, isStockManaged: false },
  { menuItemId: 'm015', name: '水果拼盘', category: '果盘', totalStock: 20, lockedStock: 2, availableStock: 18, unit: '份', warningThreshold: 3, prepTimeMinutes: 8, isStockManaged: true },
];

export const mockStockLockRecords: StockLockRecord[] = [
  { id: 'lock-stock-001', orderId: 'order-002', menuItemId: 'm001', menuItemName: '北京烤鸭', quantity: 1, status: 'consumed', lockedAt: addMinutes(now, -20), reason: '消费锁定' },
  { id: 'lock-stock-002', orderId: 'order-002', menuItemId: 'm005', menuItemName: '红烧肉', quantity: 1, status: 'consumed', lockedAt: addMinutes(now, -20), reason: '消费锁定' },
  { id: 'lock-stock-003', orderId: 'order-002', menuItemId: 'm014', menuItemName: '鲜榨果汁', quantity: 2, status: 'consumed', lockedAt: addMinutes(now, -20), reason: '消费锁定' },
  { id: 'lock-stock-004', orderId: 'order-001', menuItemId: 'm002', menuItemName: '佛跳墙', quantity: 2, status: 'locked', lockedAt: addMinutes(now, -10), reason: '预点单锁定' },
  { id: 'lock-stock-005', orderId: 'order-001', menuItemId: 'm009', menuItemName: '松茸汤', quantity: 4, status: 'locked', lockedAt: addMinutes(now, -10), reason: '预点单锁定' },
];

export const mockPeakHourReservations: PeakHourReservation[] = [
  {
    id: 'peak-001',
    roomId: 'room-001',
    roomName: '牡丹厅',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '20:00',
    reason: '周末晚餐高峰预留',
    createdBy: 'manager-001',
    createdAt: addMinutes(now, -1440),
    isActive: true,
  },
  {
    id: 'peak-002',
    roomId: 'room-003',
    roomName: '兰花厅',
    date: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    endTime: '21:00',
    reason: 'VIP客户预留',
    createdBy: 'manager-001',
    createdAt: addMinutes(now, -720),
    isActive: true,
  },
];

function generatePrepTimeline(kitchenOrderId: string, items: OrderItem[], startTime: number): PrepTimelineNode[] {
  const timeline: PrepTimelineNode[] = [];
  let currentTime = startTime;
  
  items.forEach((item) => {
    const prepTime = 10 + Math.floor(Math.random() * 15);
    const cookTime = 15 + Math.floor(Math.random() * 20);
    const plateTime = 3 + Math.floor(Math.random() * 5);
    
    timeline.push({
      id: `prep-${item.id}-1`,
      kitchenOrderId,
      itemId: item.id,
      itemName: item.name,
      status: 'prepping',
      estimatedTime: currentTime,
      actualTime: currentTime,
      durationMinutes: prepTime,
    });
    
    timeline.push({
      id: `prep-${item.id}-2`,
      kitchenOrderId,
      itemId: item.id,
      itemName: item.name,
      status: 'cooking',
      estimatedTime: currentTime + prepTime * 60 * 1000,
      durationMinutes: cookTime,
    });
    
    timeline.push({
      id: `prep-${item.id}-3`,
      kitchenOrderId,
      itemId: item.id,
      itemName: item.name,
      status: 'plating',
      estimatedTime: currentTime + (prepTime + cookTime) * 60 * 1000,
      durationMinutes: plateTime,
    });
    
    currentTime += (prepTime + cookTime + plateTime) * 60 * 1000;
  });
  
  return timeline;
}

export const mockEnhancedKitchenOrders: KitchenOrder[] = [
  {
    id: 'kitchen-001',
    orderId: 'order-002',
    roomId: 'room-002',
    roomName: '梅花厅',
    items: [
      { id: 'item-001', menuItemId: 'm001', name: '北京烤鸭', price: 198, quantity: 1, category: '招牌菜' },
      { id: 'item-002', menuItemId: 'm005', name: '红烧肉', price: 68, quantity: 1, category: '家常菜' },
      { id: 'item-003', menuItemId: 'm014', name: '鲜榨果汁', price: 38, quantity: 2, category: '饮品' },
    ],
    status: 'preparing',
    priority: 'normal',
    createdAt: addMinutes(now, -15),
    startedAt: addMinutes(now, -12),
    estimatedReadyTime: addMinutes(now, 20),
    prepTimeline: generatePrepTimeline('kitchen-001', [
      { id: 'item-001', menuItemId: 'm001', name: '北京烤鸭', price: 198, quantity: 1, category: '招牌菜' },
      { id: 'item-002', menuItemId: 'm005', name: '红烧肉', price: 68, quantity: 1, category: '家常菜' },
    ], addMinutes(now, -12)),
  },
];
