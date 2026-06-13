import { useAppStore } from '@/store/appStore';
import { getStatusLabel } from '@/lib/stateMachine';
import type { Order } from '../types';
import { formatDateTime, classNames } from '@/lib/utils';
import { Circle, CheckCircle2, Clock, Lock, User, ChefHat } from 'lucide-react';

interface StatusTimelineProps {
  order: Order;
  compact?: boolean;
}

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle2,
  locked: Lock,
  min_consumption_pending: Clock,
  arrived: User,
  consuming: ChefHat,
  completed: CheckCircle2,
  cancelled: Circle,
  no_show: Circle,
  expired: Circle,
};

const statusFlow = [
  'pending',
  'locked',
  'confirmed',
  'min_consumption_pending',
  'arrived',
  'consuming',
  'completed',
];

export default function StatusTimeline({ order, compact = false }: StatusTimelineProps) {
  const { operationLogs } = useAppStore();
  const logs = operationLogs.filter((l) => l.orderId === order.id).sort((a, b) => a.timestamp - b.timestamp);

  const currentIndex = statusFlow.indexOf(order.status);

  const operationLabels: Record<string, string> = {
    create_order: '创建订单',
    pay_deposit: '支付定金',
    cancel_order: '取消订单',
    lock_room: '锁定包厢',
    unlock_room: '解锁包厢',
    confirm_min_consumption: '确认最低消费',
    extend_reserve: '延长保留',
    abnormal_release: '异常释放',
    arrive_confirm: '确认到店',
    consumption_confirm: '消费确认',
    deposit_deduct: '定金抵扣',
    refund: '退款',
    reverse_charge: '冲正',
    merge_room: '拼包',
    split_room: '拆包',
    transfer_order: '转订',
    waitlist_join: '加入候补',
    waitlist_promote: '候补提升',
    late_arrival_charge: '迟到计费',
    coupon_use: '使用优惠券',
    invoice_issue: '开具发票',
    member_benefit: '会员权益',
    update_people: '修改人数',
  };

  return (
    <div className={compact ? '' : 'bg-white rounded-2xl border border-gray-200 p-6'}>
      {!compact && <h3 className="font-semibold text-gray-900 mb-6">状态流转</h3>}

      {/* 状态流转图 */}
      <div className={compact ? '' : 'mb-8'}>
        <div className="flex items-center justify-between">
          {statusFlow.map((status, index) => {
            const Icon = statusIcons[status as keyof typeof statusIcons] || Circle;
            const isCompleted = currentIndex > index || order.status === status;
            const isCurrent = order.status === status;
            const isTerminal = ['cancelled', 'no_show', 'expired'].includes(order.status);

            if (isTerminal && index > statusFlow.indexOf('confirmed')) {
              return null;
            }

            return (
              <div key={status} className="flex flex-col items-center relative">
                {index < statusFlow.length - 1 && (
                  <div className="absolute top-4 left-full w-full h-0.5 -translate-x-1/2 -ml-4">
                    <div
                      className={classNames(
                        'h-full',
                        (currentIndex > index || (order.status === status && index < statusFlow.length - 1))
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      )}
                    />
                  </div>
                )}
                <div
                  className={classNames(
                    'w-8 h-8 rounded-full flex items-center justify-center z-10',
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500',
                    isCurrent && 'ring-4 ring-green-100',
                    isCurrent && !isCompleted && 'bg-orange-500 text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs mt-2 text-gray-600 text-center w-16">
                  {getStatusLabel(status as typeof order.status)}
                </span>
              </div>
            );
          })}
          {['cancelled', 'no_show', 'expired'].includes(order.status) && (
            <>
              <div className="absolute top-4 left-full w-full h-0.5 -translate-x-1/2 -ml-4">
                <div className="h-full bg-red-500" />
              </div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center z-10 ring-4 ring-red-100">
                  <Circle className="w-4 h-4" />
                </div>
                <span className="text-xs mt-2 text-gray-600 text-center w-16">
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 操作流水 */}
      {!compact && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-4">操作流水</h4>
          <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无操作记录</p>
          ) : (
            logs.map((log, index) => (
              <div key={log.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={classNames(
                      'w-6 h-6 rounded-full flex items-center justify-center',
                      index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                    )}
                  >
                    <span className="text-[10px] text-white font-medium">{index + 1}</span>
                  </div>
                  {index < logs.length - 1 && (
                    <div className="w-px h-full bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {operationLabels[log.type] || log.type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {log.operatorName}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {({
                        reception: '前台',
                        customer: '顾客',
                        manager: '经理',
                        cashier: '收银',
                      } as Record<string, string>)[log.operatorRole]}
                    </span>
                  </div>
                  {log.remark && (
                    <p className="text-xs text-gray-500 mt-1">{log.remark}</p>
                  )}
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      )}
    </div>
  );
}
