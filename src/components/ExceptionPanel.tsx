import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { classNames, formatDateTime, formatCurrency } from '@/lib/utils';
import type { ExceptionRecord, Order } from '@/types';
import {
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  FileText,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  XCircle,
} from 'lucide-react';

const typeLabels: Record<string, string> = {
  no_show: '顾客爽约',
  late_arrival: '顾客迟到',
  over_capacity: '人数超限',
  conflict: '时段冲突',
  payment_failed: '支付失败',
  system_error: '系统错误',
};

const typeIcons: Record<string, typeof AlertTriangle> = {
  no_show: XCircle,
  late_arrival: Clock,
  over_capacity: AlertCircle,
  conflict: AlertOctagon,
  payment_failed: AlertCircle,
  system_error: AlertTriangle,
};

const severityConfig = {
  low: { label: '低危', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' },
  medium: { label: '中危', color: 'bg-yellow-100 text-yellow-700', dotColor: 'bg-yellow-500' },
  high: { label: '高危', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' },
};

const statusConfig = {
  pending: { label: '待处理', color: 'bg-orange-100 text-orange-700' },
  handling: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', color: 'bg-green-100 text-green-700' },
};

type FilterType = 'all' | ExceptionRecord['type'];
type FilterStatus = 'all' | ExceptionRecord['status'];
type FilterSeverity = 'all' | ExceptionRecord['severity'];

export default function ExceptionPanel() {
  const { exceptionRecords, orders, rooms, resolveException, currentRole } = useAppStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all');
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredRecords = exceptionRecords
    .filter((r) => filterType === 'all' || r.type === filterType)
    .filter((r) => filterStatus === 'all' || r.status === filterStatus)
    .filter((r) => filterSeverity === 'all' || r.severity === filterSeverity)
    .filter((r) => {
      if (!searchText.trim()) return true;
      const text = searchText.toLowerCase();
      const order = orders.find((o) => o.id === r.orderId);
      const room = rooms.find((rm) => rm.id === r.roomId);
      return (
        r.description.toLowerCase().includes(text) ||
        (order?.customerName || '').toLowerCase().includes(text) ||
        (order?.orderNo || '').toLowerCase().includes(text) ||
        (room?.name || '').toLowerCase().includes(text)
      );
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const stats = {
    total: exceptionRecords.length,
    pending: exceptionRecords.filter((r) => r.status === 'pending').length,
    handling: exceptionRecords.filter((r) => r.status === 'handling').length,
    resolved: exceptionRecords.filter((r) => r.status === 'resolved').length,
    high: exceptionRecords.filter((r) => r.severity === 'high' && r.status !== 'resolved').length,
  };

  const handleResolve = (exceptionId: string) => {
    const resolution = prompt('请填写处理方案');
    if (resolution && resolution.trim()) {
      resolveException(exceptionId, resolution);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertOctagon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">异常审计中心</h3>
              <p className="text-sm text-gray-500">异常记录监控与处理</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats.high > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">{stats.high} 高危待处理</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <StatCard label="全部异常" value={stats.total} color="gray" />
          <StatCard label="待处理" value={stats.pending} color="orange" />
          <StatCard label="处理中" value={stats.handling} color="blue" />
          <StatCard label="已解决" value={stats.resolved} color="green" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索订单号、顾客、包厢、描述..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={classNames(
              'px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
              showFilters
                ? 'bg-orange-50 border-orange-300 text-orange-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <FilterSelect
              label="异常类型"
              value={filterType}
              onChange={(v) => setFilterType(v as FilterType)}
              options={[
                { value: 'all', label: '全部类型' },
                ...Object.entries(typeLabels).map(([value, label]) => ({ value, label })),
              ]}
            />
            <FilterSelect
              label="处理状态"
              value={filterStatus}
              onChange={(v) => setFilterStatus(v as FilterStatus)}
              options={[
                { value: 'all', label: '全部状态' },
                ...Object.entries(statusConfig).map(([value, cfg]) => ({ value, label: cfg.label })),
              ]}
            />
            <FilterSelect
              label="严重等级"
              value={filterSeverity}
              onChange={(v) => setFilterSeverity(v as FilterSeverity)}
              options={[
                { value: 'all', label: '全部等级' },
                ...Object.entries(severityConfig).map(([value, cfg]) => ({ value, label: cfg.label })),
              ]}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">暂无异常记录</p>
            <p className="text-sm mt-1">系统运行正常</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRecords.map((exception) => (
              <ExceptionCard
                key={exception.id}
                exception={exception}
                order={orders.find((o) => o.id === exception.orderId)}
                roomName={rooms.find((r) => r.id === exception.roomId)?.name}
                isExpanded={expandedId === exception.id}
                onToggle={() => setExpandedId(expandedId === exception.id ? null : exception.id)}
                onResolve={() => handleResolve(exception.id)}
                canResolve={currentRole === 'manager' && exception.status !== 'resolved'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'gray' | 'orange' | 'blue' | 'green';
}) {
  const colorClasses = {
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className={classNames('rounded-xl border px-4 py-3', colorClasses[color])}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ExceptionCard({
  exception,
  order,
  roomName,
  isExpanded,
  onToggle,
  onResolve,
  canResolve,
}: {
  exception: ExceptionRecord;
  order?: Order;
  roomName?: string;
  isExpanded: boolean;
  onToggle: () => void;
  onResolve: () => void;
  canResolve: boolean;
}) {
  const severity = severityConfig[exception.severity];
  const status = statusConfig[exception.status];
  const TypeIcon = typeIcons[exception.type] || AlertTriangle;

  return (
    <div
      className={classNames(
        exception.severity === 'high' && exception.status !== 'resolved' ? 'bg-red-50/30' : ''
      )}
    >
      <div onClick={onToggle} className="px-6 py-4 hover:bg-gray-50/50 cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={classNames(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                exception.severity === 'high'
                  ? 'bg-red-100'
                  : exception.severity === 'medium'
                  ? 'bg-yellow-100'
                  : 'bg-blue-100'
              )}
            >
              <TypeIcon
                className={classNames(
                  'w-5 h-5',
                  exception.severity === 'high'
                    ? 'text-red-600'
                    : exception.severity === 'medium'
                    ? 'text-yellow-600'
                    : 'text-blue-600'
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">
                  {typeLabels[exception.type] || exception.type}
                </span>
                <span
                  className={classNames(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    severity.color
                  )}
                >
                  <span className={classNames('w-1.5 h-1.5 rounded-full', severity.dotColor)} />
                  {severity.label}
                </span>
                <span
                  className={classNames(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    status.color
                  )}
                >
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{formatDateTime(exception.createdAt)}</span>
                {order && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {order.orderNo}
                  </span>
                )}
                {order && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {order.customerName}
                  </span>
                )}
                {roomName && <span>包厢: {roomName}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canResolve && exception.status !== 'resolved' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve();
                }}
                className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                处理
              </button>
            )}
            <Eye className="w-4 h-4 text-gray-400" />
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 ml-14">
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-1.5">异常描述</p>
              <p className="text-sm text-gray-800">{exception.description}</p>
            </div>

            {order && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <InfoItem label="订单号" value={order.orderNo} />
                <InfoItem label="顾客" value={order.customerName} />
                <InfoItem label="联系电话" value={order.customerPhone || '-'} />
                <InfoItem label="包厢" value={order.roomName} />
                <InfoItem label="人数" value={`${order.peopleCount}人`} />
                <InfoItem
                  label="预订时间"
                  value={`${formatDateTime(order.reserveStartTime)}`}
                />
                <InfoItem
                  label="定金"
                  value={
                    order.depositPaid
                      ? `已付 ${formatCurrency(order.depositAmount)}`
                      : '未支付'
                  }
                />
                <InfoItem label="订单状态" value={order.status} />
                {order.lateMinutes !== undefined && order.lateMinutes > 0 && (
                  <InfoItem label="迟到时长" value={`${order.lateMinutes}分钟`} />
                )}
              </div>
            )}

            {exception.status === 'resolved' && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-gray-500">处理方案</span>
                </div>
                <p className="text-sm text-green-700 ml-6">{exception.resolution}</p>
                {exception.handlerName && (
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    处理人: {exception.handlerName} ·{' '}
                    {exception.resolvedAt && formatDateTime(exception.resolvedAt)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{value}</p>
    </div>
  );
}
