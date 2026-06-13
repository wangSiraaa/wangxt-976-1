import { useAppStore } from '@/store/appStore';
import { classNames, formatCurrency, formatTime } from '@/lib/utils';
import { ChefHat, CheckCircle2, Timer, Flame } from 'lucide-react';
import { useCurrentTime } from '@/hooks/useCountdown';

const statusConfig = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-700', dotColor: 'bg-gray-400' },
  preparing: { label: '制作中', color: 'bg-orange-100 text-orange-700', dotColor: 'bg-orange-500' },
  ready: { label: '已完成', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
  served: { label: '已上菜', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' },
};

export default function KitchenPanel() {
  const { kitchenOrders, updateKitchenOrderStatus } = useAppStore();
  const now = useCurrentTime();

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

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">厨房备餐</h3>
              <p className="text-sm text-gray-500">共 {kitchenOrders.length} 个订单</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p>暂无厨房订单</p>
          </div>
        ) : (
          <div className="space-y-3">
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
      </div>
    </div>
  );
}
