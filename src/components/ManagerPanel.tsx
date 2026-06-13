import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { classNames, formatDateTime, formatCurrency, formatCountdown } from '@/lib/utils';
import { getStatusLabel, getStatusColor } from '@/lib/stateMachine';
import { useCountdown } from '@/hooks/useCountdown';
import type { Order, ApprovalRecord, ExceptionRecord } from '@/types';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  DollarSign,
  FileText,
  MessageSquare,
  UserCheck,
  CalendarClock,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const approvalTypeLabels: Record<string, string> = {
  extend_reserve: '延长保留',
  abnormal_release: '异常释放',
  min_consumption_waive: '最低消费减免',
};

export default function ManagerPanel() {
  const {
    orders,
    approvalRecords,
    exceptionRecords,
    approveApproval,
    rejectApproval,
    resolveException,
    executeOrderOperation,
    rooms,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'approvals' | 'exceptions' | 'monitor'>('approvals');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const pendingApprovals = approvalRecords.filter((a) => a.status === 'pending');
  const pendingExceptions = exceptionRecords.filter((e) => e.status === 'pending' || e.status === 'handling');

  const monitoredOrders = orders.filter((o) =>
    ['confirmed', 'locked', 'min_consumption_pending', 'arrived', 'consuming'].includes(o.status)
  );

  const handleApprove = (approvalId: string) => {
    const remark = prompt('审批意见（可选）');
    approveApproval(approvalId, remark || '');
  };

  const handleReject = (approvalId: string) => {
    const remark = prompt('请填写驳回原因');
    if (remark && remark.trim()) {
      rejectApproval(approvalId, remark);
    }
  };

  const handleResolveException = (exceptionId: string) => {
    const resolution = prompt('请填写处理方案');
    if (resolution && resolution.trim()) {
      resolveException(exceptionId, resolution);
    }
  };

  const handleConfirmMinConsumption = (orderId: string) => {
    if (confirm('确认此订单的最低消费？')) {
      executeOrderOperation(orderId, 'confirm_min_consumption');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">经理工作台</h3>
              <p className="text-sm text-gray-500">审批管理与异常处理</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {pendingApprovals.length > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{pendingApprovals.length} 待审批</span>
              </div>
            )}
            {pendingExceptions.length > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">{pendingExceptions.length} 待处理</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('approvals')}
            className={classNames(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
              activeTab === 'approvals' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            审批中心
            {pendingApprovals.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={classNames(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
              activeTab === 'exceptions' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            异常处理
            {pendingExceptions.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {pendingExceptions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={classNames(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
              activeTab === 'monitor' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            订单监控
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'approvals' && (
          <div className="p-6 space-y-4">
            {approvalRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>暂无审批记录</p>
              </div>
            ) : (
              approvalRecords
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((approval) => (
                  <ApprovalCard
                    key={approval.id}
                    approval={approval}
                    order={orders.find((o) => o.id === approval.orderId)}
                    onApprove={() => handleApprove(approval.id)}
                    onReject={() => handleReject(approval.id)}
                  />
                ))
            )}
          </div>
        )}

        {activeTab === 'exceptions' && (
          <div className="p-6 space-y-4">
            {exceptionRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>暂无异常记录</p>
              </div>
            ) : (
              exceptionRecords
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((exception) => (
                  <ExceptionCard
                    key={exception.id}
                    exception={exception}
                    order={orders.find((o) => o.id === exception.orderId)}
                    room={rooms.find((r) => r.id === exception.roomId)}
                    onResolve={() => handleResolveException(exception.id)}
                  />
                ))
            )}
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="divide-y divide-gray-100">
            {monitoredOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CalendarClock className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>暂无进行中的订单</p>
              </div>
            ) : (
              monitoredOrders.map((order) => (
                <MonitorOrderCard
                  key={order.id}
                  order={order}
                  room={rooms.find((r) => r.id === order.roomId)}
                  isExpanded={expandedOrderId === order.id}
                  orderApprovals={approvalRecords.filter((a) => a.orderId === order.id)}
                  onToggle={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  onConfirmMinConsumption={handleConfirmMinConsumption}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ApprovalCard({
  approval,
  order,
  onApprove,
  onReject,
}: {
  approval: ApprovalRecord;
  order?: Order;
  onApprove: () => void;
  onReject: () => void;
}) {
  const statusConfig = {
    pending: { label: '待审批', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { label: '已通过', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: '已驳回', color: 'bg-red-100 text-red-700', icon: XCircle },
  };

  const status = statusConfig[approval.status];
  const StatusIcon = status.icon;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={classNames('px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1', status.color)}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {approvalTypeLabels[approval.type]}
            </span>
          </div>
          <span className="text-xs text-gray-500">{formatDateTime(approval.createdAt)}</span>
        </div>

        {order && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-700">
              <span className="text-gray-500">包厢:</span> {order.roomName}
            </span>
            <span className="text-gray-700">
              <span className="text-gray-500">顾客:</span> {order.customerName}
            </span>
            <span className="text-gray-700">
              <span className="text-gray-500">人数:</span> {order.peopleCount}人
            </span>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-gray-100">
        <div className="flex items-start gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500 mb-1">申请原因</p>
            <p className="text-sm text-gray-800">{approval.reason}</p>
          </div>
        </div>

        {approval.extraData && Object.keys(approval.extraData).length > 0 && (
          <div className="flex items-start gap-2 mb-3">
            <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-1">附加信息</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(approval.extraData).map(([key, value]) => (
                  <span key={key} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2">
          <UserCheck className="w-4 h-4 text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500 mb-1">申请人</p>
            <p className="text-sm text-gray-800">{approval.applicantName}</p>
          </div>
        </div>

        {approval.status !== 'pending' && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  审批人: {approval.approverName} · {approval.approvedAt && formatDateTime(approval.approvedAt)}
                </p>
                {approval.approvalRemark && (
                  <p className="text-sm text-gray-800">意见: {approval.approvalRemark}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {approval.status === 'pending' && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            驳回
          </button>
          <button
            onClick={onApprove}
            className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            通过
          </button>
        </div>
      )}
    </div>
  );
}

function ExceptionCard({
  exception,
  order,
  room,
  onResolve,
}: {
  exception: ExceptionRecord;
  order?: Order;
  room?: { name: string };
  onResolve: () => void;
}) {
  const severityConfig = {
    low: { label: '低', color: 'bg-blue-100 text-blue-700' },
    medium: { label: '中', color: 'bg-yellow-100 text-yellow-700' },
    high: { label: '高', color: 'bg-red-100 text-red-700' },
  };

  const typeLabels: Record<string, string> = {
    no_show: '顾客爽约',
    late_arrival: '顾客迟到',
    over_capacity: '人数超限',
    conflict: '时段冲突',
    payment_failed: '支付失败',
    system_error: '系统错误',
  };

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    handling: '处理中',
    resolved: '已解决',
  };

  const severity = severityConfig[exception.severity];

  return (
    <div className={classNames(
      'border rounded-xl overflow-hidden',
      exception.severity === 'high' ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
    )}>
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className={classNames(
              'w-5 h-5',
              exception.severity === 'high' ? 'text-red-500' : exception.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
            )} />
            <span className="font-medium text-gray-900">{typeLabels[exception.type] || exception.type}</span>
            <span className={classNames('px-2 py-0.5 rounded text-xs font-medium', severity.color)}>
              {severity.label}危
            </span>
            <span className={classNames(
              'px-2 py-0.5 rounded text-xs',
              exception.status === 'resolved' ? 'bg-green-100 text-green-700' : exception.status === 'handling' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
            )}>
              {statusLabels[exception.status]}
            </span>
          </div>
          <span className="text-xs text-gray-500">{formatDateTime(exception.createdAt)}</span>
        </div>

        <div className="flex items-center gap-4 text-sm mb-3">
          {order && (
            <span className="text-gray-600">
              订单: <span className="text-gray-900 font-medium">{order.orderNo}</span>
            </span>
          )}
          {room && (
            <span className="text-gray-600">
              包厢: <span className="text-gray-900 font-medium">{room.name}</span>
            </span>
          )}
          {order && (
            <span className="text-gray-600">
              顾客: <span className="text-gray-900 font-medium">{order.customerName}</span>
            </span>
          )}
        </div>

        <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-gray-100">
          {exception.description}
        </p>

        {exception.status === 'resolved' && exception.resolution && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500">处理方案:</span>
            </div>
            <p className="text-sm text-green-700 mt-1 ml-6">{exception.resolution}</p>
            {exception.handlerName && (
              <p className="text-xs text-gray-500 mt-1 ml-6">处理人: {exception.handlerName}</p>
            )}
          </div>
        )}
      </div>

      {exception.status !== 'resolved' && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onResolve}
            className="w-full py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            处理异常
          </button>
        </div>
      )}
    </div>
  );
}

function MonitorOrderCard({
  order,
  isExpanded,
  orderApprovals,
  onToggle,
  onConfirmMinConsumption,
}: {
  order: Order;
  room?: { name: string };
  isExpanded: boolean;
  orderApprovals: ApprovalRecord[];
  onToggle: () => void;
  onConfirmMinConsumption: (orderId: string) => void;
}) {
  const reserveCountdown = useCountdown(order.reserveExpireTime);
  const lockCountdown = useCountdown(order.lockExpireTime);

  return (
    <div>
      <div
        onClick={onToggle}
        className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{order.roomName}</span>
                <span className={classNames('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(order.status))}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {order.customerName} · {order.peopleCount}人 · {order.orderNo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">最低消费</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(order.minConsumption)}
              </p>
            </div>
            {order.reserveExpireTime && (
              <div className="text-right">
                <p className="text-xs text-gray-500">保留剩余</p>
                <p className={classNames(
                  'text-sm font-mono font-semibold',
                  reserveCountdown < 300 ? 'text-red-600 animate-pulse' : 'text-orange-600'
                )}>
                  {formatCountdown(reserveCountdown)}
                </p>
              </div>
            )}
            {order.lockExpireTime && (
              <div className="text-right">
                <p className="text-xs text-gray-500">锁包剩余</p>
                <p className={classNames(
                  'text-sm font-mono font-semibold',
                  lockCountdown < 60 ? 'text-red-600 animate-pulse' : 'text-purple-600'
                )}>
                  {formatCountdown(lockCountdown)}
                </p>
              </div>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-4 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">预订时间</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDateTime(order.reserveStartTime)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">最低消费状态</p>
              <p className={classNames(
                'text-sm font-medium',
                order.isMinConsumptionConfirmed ? 'text-green-600' : 'text-yellow-600'
              )}>
                {order.isMinConsumptionConfirmed ? '已确认' : '待确认'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">定金状态</p>
              <p className={classNames(
                'text-sm font-medium',
                order.depositPaid ? 'text-green-600' : 'text-gray-600'
              )}>
                {order.depositPaid ? `已付 ${formatCurrency(order.depositAmount)}` : '未支付'}
              </p>
            </div>
          </div>

          {!order.isMinConsumptionConfirmed && (
            <button
              onClick={() => onConfirmMinConsumption(order.id)}
              className="w-full py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              确认最低消费
            </button>
          )}

          {orderApprovals.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">相关审批记录</p>
              <div className="space-y-2">
                {orderApprovals.map((a) => (
                  <div key={a.id} className="bg-white rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">
                        {approvalTypeLabels[a.type]}
                      </span>
                      <span className={classNames(
                        'px-2 py-0.5 rounded text-xs',
                        a.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : a.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      )}>
                        {a.status === 'approved' ? '已通过' : a.status === 'rejected' ? '已驳回' : '待审批'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      申请人: {a.applicantName} · {formatDateTime(a.createdAt)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">原因: {a.reason}</p>
                    {a.approvalRemark && (
                      <p className="text-xs text-gray-500 mt-1">审批意见: {a.approvalRemark}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
