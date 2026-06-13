import type { Order, OrderStatus, StateTransition, OperationType } from '../types';

export const stateTransitions: StateTransition[] = [
  {
    from: ['pending'],
    to: 'confirmed',
    event: 'pay_deposit',
    condition: (order) => !order.depositPaid,
    action: () => ({
      depositPaid: true,
      depositPaidAt: Date.now(),
      reserveExpireTime: Date.now() + 30 * 60 * 1000,
    }),
  },
  {
    from: ['pending', 'confirmed', 'min_consumption_pending'],
    to: 'locked',
    event: 'lock_room',
    condition: (order) => !order.lockExpireTime || order.lockExpireTime < Date.now(),
    action: () => ({
      lockExpireTime: Date.now() + 15 * 60 * 1000,
    }),
  },
  {
    from: ['locked'],
    to: 'pending',
    event: 'unlock_room',
    action: (order) => ({
      lockExpireTime: undefined,
      status: order.depositPaid ? 'confirmed' : 'pending',
    } as Partial<Order>),
  },
  {
    from: ['pending', 'confirmed'],
    to: 'min_consumption_pending',
    event: 'create_order',
    condition: (order) => order.peopleCount > 0 && order.minConsumption > 0 && !order.isMinConsumptionConfirmed,
  },
  {
    from: ['min_consumption_pending', 'confirmed'],
    to: 'confirmed',
    event: 'confirm_min_consumption',
    action: () => ({
      isMinConsumptionConfirmed: true,
    }),
  },
  {
    from: ['confirmed', 'min_consumption_pending', 'locked'],
    to: 'arrived',
    event: 'arrive_confirm',
    condition: (order) => {
      if (order.minConsumption > 0 && !order.isMinConsumptionConfirmed) {
        return false;
      }
      return true;
    },
    action: () => ({
      actualArrivalTime: Date.now(),
    }),
  },
  {
    from: ['arrived'],
    to: 'consuming',
    event: 'consumption_confirm',
  },
  {
    from: ['consuming'],
    to: 'completed',
    event: 'consumption_confirm',
    action: () => ({
      actualLeaveTime: Date.now(),
    }),
  },
  {
    from: ['pending', 'confirmed', 'locked', 'min_consumption_pending'],
    to: 'cancelled',
    event: 'cancel_order',
  },
  {
    from: ['cancelled'],
    to: 'pending',
    event: 'cancel_order',
    condition: (order) => {
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      return order.createdAt > tenMinutesAgo;
    },
    action: () => ({
      status: 'pending',
    } as Partial<Order>),
  },
  {
    from: ['confirmed', 'min_consumption_pending'],
    to: 'no_show',
    event: 'abnormal_release',
    condition: (order) => {
      if (!order.reserveExpireTime) return false;
      return Date.now() > order.reserveExpireTime;
    },
  },
  {
    from: ['locked'],
    to: 'expired',
    event: 'abnormal_release',
    condition: (order) => {
      if (!order.lockExpireTime) return false;
      return Date.now() > order.lockExpireTime;
    },
    action: (order) => ({
      status: order.depositPaid ? 'confirmed' : 'pending',
      lockExpireTime: undefined,
    } as Partial<Order>),
  },
  {
    from: ['confirmed', 'min_consumption_pending'],
    to: 'confirmed',
    event: 'extend_reserve',
    action: (order, payload) => ({
      extendCount: order.extendCount + 1,
      reserveExpireTime: (payload?.extendMinutes as number)
        ? Date.now() + (payload.extendMinutes as number) * 60 * 1000
        : order.reserveExpireTime,
    }),
  },
  {
    from: ['pending', 'confirmed', 'min_consumption_pending'],
    to: 'pending',
    event: 'update_people',
    condition: (order, payload) => {
      if (order.status === 'arrived' || order.status === 'consuming' || order.status === 'completed') {
        return false;
      }
      const newPeopleCount = payload?.peopleCount as number;
      return newPeopleCount > 0;
    },
    action: (order, payload) => ({
      peopleCount: (payload?.peopleCount as number) || order.peopleCount,
      status: order.depositPaid ? 'confirmed' : 'pending',
    } as Partial<Order>),
  },
  {
    from: ['arrived', 'consuming'],
    to: 'arrived',
    event: 'update_people',
    condition: (order, payload) => {
      const newPeopleCount = payload?.peopleCount as number;
      return newPeopleCount > 0;
    },
    action: (order, payload) => ({
      peopleCount: (payload?.peopleCount as number) || order.peopleCount,
      status: order.status === 'consuming' ? 'consuming' : 'arrived',
    } as Partial<Order>),
  },
  {
    from: ['pending', 'confirmed', 'min_consumption_pending', 'locked'],
    to: 'confirmed',
    event: 'transfer_order',
    action: (order, payload) => ({
      roomId: (payload?.roomId as string) || order.roomId,
      roomName: (payload?.roomName as string) || order.roomName,
      minConsumption: (payload?.minConsumption as number) || order.minConsumption,
      depositAmount: (payload?.depositAmount as number) || order.depositAmount,
    }),
  },
  {
    from: ['pending', 'confirmed', 'min_consumption_pending', 'locked'],
    to: 'pending',
    event: 'merge_room',
    condition: (order, payload) => {
      const isMainOrder = payload?.isMainOrder as boolean;
      if (isMainOrder) {
        return order.depositPaid ? false : true;
      }
      return true;
    },
    action: (order, payload) => ({
      status: order.depositPaid ? 'confirmed' : 'pending',
      mergeId: (payload?.mergeId as string) || order.mergeId,
    } as Partial<Order>),
  },
  {
    from: ['pending', 'confirmed', 'min_consumption_pending'],
    to: 'pending',
    event: 'split_room',
    action: (order, payload) => ({
      status: order.depositPaid ? 'confirmed' : 'pending',
      mergeId: undefined,
      peopleCount: (payload?.peopleCount as number) || order.peopleCount,
    } as Partial<Order>),
  },
  {
    from: ['cancelled', 'no_show', 'expired'],
    to: 'pending',
    event: 'reverse_charge',
    condition: (order) => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      return order.updatedAt > oneHourAgo;
    },
    action: (order) => ({
      status: order.depositPaid ? 'confirmed' : 'pending',
    } as Partial<Order>),
  },
  {
    from: ['pending', 'confirmed', 'min_consumption_pending', 'locked'],
    to: 'min_consumption_pending',
    event: 'update_people',
    condition: (order, payload) => {
      const newPeopleCount = payload?.peopleCount as number;
      const roomCapacity = payload?.roomCapacity as number;
      if (roomCapacity && newPeopleCount > roomCapacity) {
        return false;
      }
      return order.minConsumption > 0 && !order.isMinConsumptionConfirmed;
    },
    action: (order, payload) => ({
      peopleCount: (payload?.peopleCount as number) || order.peopleCount,
      status: 'min_consumption_pending',
    } as Partial<Order>),
  },
];

export function canTransition(order: Order, event: OperationType): boolean {
  return stateTransitions.some(
    (t) => t.event === event && t.from.includes(order.status) && (!t.condition || t.condition(order))
  );
}

export function applyTransition(
  order: Order,
  event: OperationType,
  payload?: Record<string, unknown>
): Order | null {
  const transition = stateTransitions.find(
    (t) => t.event === event && t.from.includes(order.status) && (!t.condition || t.condition(order, payload))
  );

  if (!transition) return null;

  const updates = transition.action ? transition.action(order, payload) : {};
  const newStatus = updates.status || transition.to;

  return {
    ...order,
    ...updates,
    status: newStatus,
    updatedAt: Date.now(),
  };
}

export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: '待确认',
    confirmed: '已确认',
    locked: '锁包中',
    min_consumption_pending: '最低消费待确认',
    arrived: '已到店',
    consuming: '消费中',
    completed: '已完成',
    cancelled: '已取消',
    no_show: '爽约',
    expired: '已过期',
  };
  return labels[status] || status;
}

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: 'bg-gray-100 text-gray-700',
    confirmed: 'bg-blue-100 text-blue-700',
    locked: 'bg-orange-100 text-orange-700',
    min_consumption_pending: 'bg-yellow-100 text-yellow-700',
    arrived: 'bg-purple-100 text-purple-700',
    consuming: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
    no_show: 'bg-red-100 text-red-600',
    expired: 'bg-gray-100 text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function isFinalStatus(status: OrderStatus): boolean {
  return ['completed', 'cancelled', 'no_show'].includes(status);
}

export function canModifyOrder(order: Order): boolean {
  return !['completed', 'cancelled', 'no_show', 'expired'].includes(order.status);
}

export function canModifyPeople(order: Order): boolean {
  return ['pending', 'confirmed', 'min_consumption_pending', 'locked', 'arrived', 'consuming'].includes(order.status);
}

export function isOrderActive(order: Order): boolean {
  return ['confirmed', 'locked', 'min_consumption_pending', 'arrived', 'consuming'].includes(order.status);
}
