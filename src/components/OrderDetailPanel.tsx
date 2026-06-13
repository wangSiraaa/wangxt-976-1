import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { getStatusLabel, getStatusColor, canTransition } from '@/lib/stateMachine';
import type { Order, RoleType, OperationType } from '@/types';
import { classNames, formatCurrency, formatDateTime, formatCountdown } from '@/lib/utils';
import { useCountdown } from '@/hooks/useCountdown';
import {
  Users,
  Clock,
  Lock,
  DollarSign,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock3,
  User,
  CreditCard,
  Undo2,
  Send,
  Settings,
  X,
} from 'lucide-react';

interface OrderDetailPanelProps {
  order: Order;
  onClose?: () => void;
}

const rolePermissions: Record<RoleType, OperationType[]> = {
  reception: [
    'lock_room', 'unlock_room', 'update_people', 'create_order',
    'arrive_confirm', 'transfer_order', 'merge_room', 'split_room',
  ],
  customer: [
    'pay_deposit', 'cancel_order', 'update_people',
  ],
  manager: [
    'confirm_min_consumption', 'extend_reserve', 'abnormal_release',
  ],
  cashier: [
    'consumption_confirm', 'deposit_deduct', 'refund', 'reverse_charge',
    'arrive_confirm',
  ],
};

const operationLabels: Record<OperationType, { label: string; icon: typeof Users; variant: 'primary' | 'danger' | 'warning' | 'success' | 'default' }> = {
  pay_deposit: { label: '支付定金', icon: CreditCard, variant: 'primary' },
  cancel_order: { label: '取消订单', icon: XCircle, variant: 'danger' },
  update_people: { label: '修改人数', icon: Users, variant: 'default' },
  lock_room: { label: '锁包', icon: Lock, variant: 'warning' },
  unlock_room: { label: '解锁', icon: XCircle, variant: 'warning' },
  confirm_min_consumption: { label: '确认最低消费', icon: CheckCircle, variant: 'success' },
  extend_reserve: { label: '延长保留', icon: Clock, variant: 'warning' },
  abnormal_release: { label: '异常释放', icon: AlertTriangle, variant: 'danger' },
  arrive_confirm: { label: '确认到店', icon: CheckCircle, variant: 'success' },
  consumption_confirm: { label: '确认消费', icon: DollarSign, variant: 'primary' },
  deposit_deduct: { label: '定金抵扣', icon: DollarSign, variant: 'primary' },
  refund: { label: '退款', icon: Undo2, variant: 'warning' },
  reverse_charge: { label: '冲正', icon: Settings, variant: 'warning' },
  transfer_order: { label: '转订', icon: Send, variant: 'primary' },
  merge_room: { label: '拼包', icon: Users, variant: 'default' },
  split_room: { label: '拆包', icon: Users, variant: 'default' },
  waitlist_join: { label: '加入候补', icon: Clock3, variant: 'default' },
  waitlist_promote: { label: '候补提升', icon: Clock3, variant: 'default' },
  late_arrival_charge: { label: '迟到计费', icon: Clock3, variant: 'warning' },
  coupon_use: { label: '使用优惠券', icon: CreditCard, variant: 'success' },
  invoice_issue: { label: '开发票', icon: CreditCard, variant: 'default' },
  member_benefit: { label: '会员权益', icon: User, variant: 'success' },
  create_order: { label: '创建订单', icon: Calendar, variant: 'primary' },
};

export default function OrderDetailPanel({ order, onClose }: OrderDetailPanelProps) {
  const {
    currentRole,
    payDeposit,
    cancelOrder,
    confirmArrival,
    confirmConsumption,
    updateOrder,
    createApproval,
    rooms,
  } = useAppStore();

  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [newPeopleCount, setNewPeopleCount] = useState(order.peopleCount);
  const [approvalReason, setApprovalReason] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState<'extend' | 'release' | null>(null);

  const reserveCountdown = useCountdown(order.reserveExpireTime);
  const lockCountdown = useCountdown(order.lockExpireTime);

  const room = rooms.find((r) => r.id === order.roomId);
  const allowedOperations = rolePermissions[currentRole] || [];

  const availableOperations = allowedOperations.filter((op) => canTransition(order, op));

  const isFieldLocked = ['arrived', 'consuming', 'completed', 'cancelled', 'no_show'].includes(order.status);

  const handleOperation = async (op: OperationType) => {
    switch (op) {
      case 'pay_deposit':
        if (confirm(`确认支付定金 ${formatCurrency(order.depositAmount)}?`)) {
          payDeposit(order.id, 'wechat');
        }
        break;
      case 'cancel_order':
        if (confirm('确认取消此订单？取消将扣除部分定金。')) {
          cancelOrder(order.id);
        }
        break;
      case 'arrive_confirm':
        if (confirm('确认顾客已到店？')) {
          confirmArrival(order.id);
        }
        break;
      case 'consumption_confirm':
        if (confirm('确认消费完成？')) {
          confirmConsumption(order.id);
        }
        break;
      case 'update_people':
        setShowPeopleModal(true);
        break;
      case 'extend_reserve':
        setShowApprovalModal('extend');
        break;
      case 'abnormal_release':
        setShowApprovalModal('release');
        break;
      default:
        break;
    }
  };

  const handleUpdatePeople = () => {
    if (newPeopleCount <= 0) {
      alert('人数不能小于1');
      return;
    }
    if (room && newPeopleCount > room.capacity) {
      if (!confirm(`人数 ${newPeopleCount} 人超过包厢容量 ${room.capacity} 人，确认继续？`)) {
        return;
      }
    }
    updateOrder(order.id, { peopleCount: newPeopleCount });
    setShowPeopleModal(false);
  };

  const handleSubmitApproval = () => {
    if (!approvalReason.trim()) {
      alert('请填写审批原因');
      return;
    }
    if (showApprovalModal === 'extend') {
      createApproval(order.id, 'extend_reserve', approvalReason, { extendMinutes: 30 });
    } else if (showApprovalModal === 'release') {
      createApproval(order.id, 'abnormal_release', approvalReason);
    }
    setShowApprovalModal(null);
    setApprovalReason('');
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-orange-600 hover:bg-orange-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    default: 'bg-gray-600 hover:bg-gray-700 text-white',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 h-full flex flex-col overflow-hidden">
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">订单详情</h3>
            <span className="text-sm text-gray-500 font-mono">{order.orderNo}</span>
            <span className={classNames('px-2.5 py-1 rounded-full text-xs font-medium', getStatusColor(order.status))}>
              {getStatusLabel(order.status)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {order.roomName} · {formatDateTime(order.createdAt)}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 倒计时 */}
        {(order.reserveExpireTime || order.lockExpireTime) && (
          <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100">
            <div className="flex items-center gap-4">
              {order.lockExpireTime && (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-700">锁包倒计时:</span>
                  <span className={classNames(
                    'font-mono text-lg font-bold',
                    lockCountdown < 60 ? 'text-red-600 animate-pulse' : 'text-orange-600'
                  )}>
                    {formatCountdown(lockCountdown)}
                  </span>
                </div>
              )}
              {order.reserveExpireTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">保留倒计时:</span>
                  <span className={classNames(
                    'font-mono text-lg font-bold',
                    reserveCountdown < 300 ? 'text-red-600 animate-pulse' : 'text-yellow-600'
                  )}>
                    {formatCountdown(reserveCountdown)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 顾客信息 */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            顾客信息
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">顾客姓名</p>
              <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">联系电话</p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {order.customerPhone}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">用餐人数</p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {order.peopleCount} 人
                {room && order.peopleCount > room.capacity && (
                  <AlertTriangle className="w-3 h-3 text-orange-500" />
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">订单来源</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{order.source}</p>
            </div>
          </div>
        </div>

        {/* 预订信息 */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            预订信息
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">预订开始</p>
              <p className="text-sm font-medium text-gray-900">{formatDateTime(order.reserveStartTime)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">预订结束</p>
              <p className="text-sm font-medium text-gray-900">{formatDateTime(order.reserveEndTime)}</p>
            </div>
            {order.actualArrivalTime && (
              <div>
                <p className="text-xs text-gray-500">实际到店</p>
                <p className="text-sm font-medium text-gray-900">{formatDateTime(order.actualArrivalTime)}</p>
              </div>
            )}
            {order.actualLeaveTime && (
              <div>
                <p className="text-xs text-gray-500">实际离店</p>
                <p className="text-sm font-medium text-gray-900">{formatDateTime(order.actualLeaveTime)}</p>
              </div>
            )}
          </div>
        </div>

        {/* 金额信息 */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            金额信息
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">最低消费</span>
              <span className="font-medium text-gray-900">{formatCurrency(order.minConsumption)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">预订定金</span>
              <span className={classNames('font-medium', order.depositPaid ? 'text-green-600' : 'text-gray-900')}>
                {formatCurrency(order.depositAmount)}
                {order.depositPaid && ' ✓ 已支付'}
              </span>
            </div>
            {order.items.length > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">消费总额</span>
                  <span className="font-medium text-gray-900">{formatCurrency(order.totalAmount)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">优惠金额</span>
                    <span className="font-medium text-green-600">-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                {order.lateFee && order.lateFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">迟到费用</span>
                    <span className="font-medium text-orange-600">+{formatCurrency(order.lateFee)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100 flex justify-between">
                  <span className="text-sm font-semibold text-gray-700">应付金额</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(order.actualAmount || order.totalAmount)}</span>
                </div>
              </>
            )}
            {order.useMemberBenefit && (
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                ✓ 已使用会员权益
              </div>
            )}
            {order.isMinConsumptionConfirmed ? (
              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                ✓ 最低消费已确认
              </div>
            ) : (
              <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                ⚠ 最低消费待确认
              </div>
            )}
          </div>
        </div>

        {/* 锁定字段提示 */}
        {isFieldLocked && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              订单关键字段已锁定，不可修改
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        {availableOperations.length > 0 && (
          <div className="px-6 py-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">可用操作</h4>
            <div className="grid grid-cols-2 gap-2">
              {availableOperations.map((op) => {
                const config = operationLabels[op];
                const Icon = config.icon;
                return (
                  <button
                    key={op}
                    onClick={() => handleOperation(op)}
                    className={classNames(
                      'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                      variantClasses[config.variant]
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 修改人数弹窗 */}
      {showPeopleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">修改用餐人数</h3>
            <input
              type="number"
              min={1}
              value={newPeopleCount}
              onChange={(e) => setNewPeopleCount(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {room && (
              <p className="text-xs text-gray-500 mt-2">
                包厢容量: {room.capacity} 人
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPeopleModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleUpdatePeople}
                className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 审批弹窗 */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">
              {showApprovalModal === 'extend' ? '申请延长保留' : '申请异常释放'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {showApprovalModal === 'extend'
                ? '延长保留需要经理审批，请填写原因'
                : '异常释放需要经理审批，请填写原因'}
            </p>
            <textarea
              value={approvalReason}
              onChange={(e) => setApprovalReason(e.target.value)}
              placeholder="请填写审批原因..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowApprovalModal(null);
                  setApprovalReason('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmitApproval}
                className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                提交审批
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
