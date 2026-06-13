import { useAppStore } from '@/store/appStore';
import { classNames, formatCurrency, formatTime } from '@/lib/utils';
import {
  ChefHat,
  CheckCircle2,
  Timer,
  Flame,
  AlertTriangle,
  Package,
  Clock,
  CookingPot,
  Utensils,
  HandPlatter,
} from 'lucide-react';
import { useCurrentTime } from '@/hooks/useCountdown';
import { useState } from 'react';

const statusConfig = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-700', dotColor: 'bg-gray-400' },
  preparing: { label: '制作中', color: 'bg-orange-100 text-orange-700', dotColor: 'bg-orange-500' },
  ready: { label: '已完成', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
  served: { label: '已上菜', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' },
};

const prepStepIcons = {
  waiting: Clock,
  prepping: Package,
  cooking: CookingPot,
  plating: Utensils,
  ready: HandPlatter,
  served: CheckCircle2,
};

const prepStepLabels = {
  waiting: '等待中',
  prepping: '备料中',
  cooking: '烹饪中',
  plating: '摆盘',
  ready: '待上菜',
  served: '已上菜',
};

export default function KitchenPanel() {
  const { kitchenOrders, updateKitchenOrderStatus, menuItemStocks } = useAppStore();
  const now = useCurrentTime();
  const [activeTab, setActiveTab] = useState<'orders' | 'stock'>('orders');

  const sortedOrders = [...kitchenOrders].sort((a, b) => {
    const priorityOrder = { urgent: 0, normal: 1 };
    const statusOrder = { pending: 0, preparing: 1, ready: 2, served: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return a.createdAt - b.createdAt;
  });

  const handleStatusChange = (id: string, nextStatus: typeof kitchenOrders[0]['status']) => {
    updateKitchenOrderStatus(id, nextStatus);
  };

  const stats = {
    pending: kitchenOrders.filter((o) => o.status === 'pending').length,
    preparing: kitchenOrders.filter((o) => o.status === 'preparing').length,
    ready: kitchenOrders.filter((o) => o.status === 'ready').length,
    served: kitchenOrders.filter((o) => o.status === 'served').length,
  };

  const warningStocks = menuItemStocks.filter(
    (s) => s.isStockManaged && s.availableStock <= s.warningThreshold
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">厨房备餐</h3>
              <p className="text-sm text-gray-500">共 {kitchenOrders.length} 个订单</p>
            </div>
          </div>
          {warningStocks.length > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{warningStocks.length} 种库存预警</span>
            </div>
          )}
        </div>

        {/* Tab切换 */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={classNames(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'orders'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            备餐订单
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={classNames(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors relative',
              activeTab === 'stock'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            库存监控
            {warningStocks.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {warningStocks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 统计栏 */}
      {activeTab === 'orders' && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-xs text-gray-500">待处理</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">{stats.preparing}</p>
            <p className="text-xs text-gray-500">制作中</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{stats.ready}</p>
            <p className="text-xs text-gray-500">已完成</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.served}</p>
            <p className="text-xs text-gray-500">已上菜</p>
          </div>
        </div>
      )}

      <div className="p-4 max-h-[480px] overflow-y-auto">
        {activeTab === 'orders' && (
          <>
            {sortedOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>暂无厨房订单</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedOrders.map((order) => {
                  const status = statusConfig[order.status];
                  const waitTime = order.estimatedReadyTime ? Math.max(0, Math.floor((order.estimatedReadyTime - now) / 60000)) : 0;
                  const isUrgent = order.priority === 'urgent' || (order.status === 'preparing' && waitTime < 5);

                  return (
                    <div
                      key={order.id}
                      className={classNames(
                        'border rounded-xl p-4 transition-all',
                        isUrgent ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {order.priority === 'urgent' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                              <Flame className="w-3 h-3" />
                              加急
                            </span>
                          )}
                          <span className={classNames('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', status.color)}>
                            <span className={classNames('w-1.5 h-1.5 rounded-full animate-pulse', status.dotColor)} />
                            {status.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{order.roomName}</p>
                          <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                        </div>
                      </div>

                      {/* 备餐时间线 */}
                      {order.prepTimeline && order.prepTimeline.length > 0 && (
                        <div className="mb-3 py-2 px-3 bg-white rounded-lg border border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">备餐进度</p>
                          <div className="flex items-center justify-between">
                            {order.prepTimeline.map((node, idx) => {
                              const StepIcon = prepStepIcons[node.status as keyof typeof prepStepIcons] || Clock;
                              const isActive = node.status !== 'waiting';
                              const isLast = idx === order.prepTimeline!.length - 1;

                              return (
                                <div key={idx} className="flex flex-col items-center flex-1 relative">
                                  {!isLast && (
                                    <div className="absolute top-3 left-1/2 w-full h-0.5 -translate-y-1/2">
                                      <div
                                        className={classNames(
                                          'h-full',
                                          isActive ? 'bg-green-500' : 'bg-gray-200'
                                        )}
                                      />
                                    </div>
                                  )}
                                  <div
                                    className={classNames(
                                      'w-6 h-6 rounded-full flex items-center justify-center z-10',
                                      isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                                    )}
                                  >
                                    <StepIcon className="w-3 h-3" />
                                  </div>
                                  <span className="text-[10px] text-gray-500 mt-1">
                                    {prepStepLabels[node.status as keyof typeof prepStepLabels]}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5 mb-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">
                              {item.name} × {item.quantity}
                            </span>
                            <span className="text-gray-500">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {order.estimatedReadyTime && order.status === 'preparing' && (
                        <div className="flex items-center gap-2 mb-3 text-sm">
                          <Timer className="w-4 h-4 text-orange-500" />
                          <span className={classNames('font-mono', waitTime < 5 ? 'text-red-500 animate-pulse' : 'text-gray-600')}>
                            预计 {waitTime} 分钟后完成
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'preparing')}
                            className="flex-1 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            开始制作
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'ready')}
                            className="flex-1 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                          >
                            制作完成
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'served')}
                            className="flex-1 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            确认上菜
                          </button>
                        )}
                        {order.status === 'served' && (
                          <div className="flex-1 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg text-center flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            已完成
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'stock' && (
          <div className="space-y-3">
            {warningStocks.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  库存预警
                </h4>
                <div className="space-y-2">
                  {warningStocks.map((stock) => (
                    <div
                      key={stock.id}
                      className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{stock.name}</p>
                        <p className="text-xs text-gray-500">{stock.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">
                          {stock.availableStock} {stock.unit}
                        </p>
                        <p className="text-xs text-red-500">
                          警戒线 {stock.warningThreshold} {stock.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h4 className="text-sm font-semibold text-gray-700 mb-2">全部菜品库存</h4>
            {menuItemStocks.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">暂无库存数据</p>
              </div>
            ) : (
              <div className="space-y-2">
                {menuItemStocks.map((stock) => {
                  const isWarning = stock.isStockManaged && stock.availableStock <= stock.warningThreshold;
                  const percentage = stock.totalStock > 0
                    ? (stock.availableStock / stock.totalStock) * 100
                    : 0;

                  return (
                    <div
                      key={stock.id}
                      className={classNames(
                        'p-3 rounded-lg border',
                        isWarning ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{stock.name}</span>
                          {!stock.isStockManaged && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                              不管理
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{stock.category}</span>
                      </div>

                      {stock.isStockManaged && (
                        <>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                            <span>可用: {stock.availableStock} {stock.unit}</span>
                            <span>锁定: {stock.lockedStock} {stock.unit}</span>
                            <span>总计: {stock.totalStock} {stock.unit}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={classNames(
                                'h-full rounded-full transition-all',
                                isWarning ? 'bg-red-500' : 'bg-green-500'
                              )}
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                          </div>
                          <div className="mt-1.5 text-[10px] text-gray-400">
                            备餐时间: {stock.prepTimeMinutes}分钟 | 警戒线: {stock.warningThreshold} {stock.unit}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
