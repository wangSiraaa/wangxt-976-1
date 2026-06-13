import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import Header from '@/components/Header';
import RoomCard from '@/components/RoomCard';
import RoomTimeline from '@/components/RoomTimeline';
import OrderDetailPanel from '@/components/OrderDetailPanel';
import StatusTimeline from '@/components/StatusTimeline';
import KitchenPanel from '@/components/KitchenPanel';
import WaitlistPanel from '@/components/WaitlistPanel';
import ManagerPanel from '@/components/ManagerPanel';
import CashierPanel from '@/components/CashierPanel';
import ExceptionPanel from '@/components/ExceptionPanel';
import StaffShiftPanel from '@/components/StaffShiftPanel';
import CreateOrderModal from '@/components/CreateOrderModal';
import Empty from '@/components/Empty';
import {
  Plus,
  LayoutGrid,
  Clock,
  FileText,
  ChefHat,
  Users,
  AlertOctagon,
  UserCog,
} from 'lucide-react';
import { classNames } from '@/lib/utils';

type ReceptionView = 'rooms' | 'timeline' | 'orders' | 'staff';
type CustomerView = 'myOrders' | 'rooms';

export default function Home() {
  const {
    currentRole,
    rooms,
    orders,
    selectedOrderId,
    setSelectedOrder,
    selectedRoomId,
    setSelectedRoom,
  } = useAppStore();

  const [receptionView, setReceptionView] = useState<ReceptionView>('rooms');
  const [customerView, setCustomerView] = useState<CustomerView>('rooms');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [defaultRoomId, setDefaultRoomId] = useState<string | undefined>(undefined);
  const [defaultStartTime, setDefaultStartTime] = useState<number | undefined>(undefined);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const handleTimelineSlotClick = (roomId: string, startTime: number, endTime: number) => {
    void endTime;
    setDefaultRoomId(roomId);
    setDefaultStartTime(startTime);
    setShowCreateOrder(true);
  };

  const handleRoomCardClick = (roomId: string) => {
    setSelectedRoom(selectedRoomId === roomId ? null : roomId);
  };

  const handleCreateOrderFromRoom = () => {
    if (selectedRoomId) {
      setDefaultRoomId(selectedRoomId);
      setDefaultStartTime(undefined);
    }
    setShowCreateOrder(true);
  };

  const renderContent = () => {
    switch (currentRole) {
      case 'reception':
        return renderReceptionView();
      case 'customer':
        return renderCustomerView();
      case 'manager':
        return renderManagerView();
      case 'cashier':
        return renderCashierView();
      default:
        return renderReceptionView();
    }
  };

  const renderReceptionView = () => (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setReceptionView('rooms')}
              className={classNames(
                'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all',
                receptionView === 'rooms'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              包厢视图
            </button>
            <button
              onClick={() => setReceptionView('timeline')}
              className={classNames(
                'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all',
                receptionView === 'timeline'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Clock className="w-4 h-4" />
              时间轴视图
            </button>
            <button
              onClick={() => setReceptionView('orders')}
              className={classNames(
                'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all',
                receptionView === 'orders'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <FileText className="w-4 h-4" />
              订单列表
            </button>
            <button
              onClick={() => setReceptionView('staff')}
              className={classNames(
                'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all',
                receptionView === 'staff'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <UserCog className="w-4 h-4" />
              排班管理
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateOrderFromRoom}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              新建预订
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {receptionView === 'rooms' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    selected={selectedRoomId === room.id}
                    onClick={() => handleRoomCardClick(room.id)}
                  />
                ))}
              </div>
              {selectedRoom && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {selectedRoom.name} - 今日预订时间轴
                  </h3>
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <RoomTimeline
                      room={selectedRoom}
                      onSlotClick={handleTimelineSlotClick}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {receptionView === 'timeline' && (
            <div className="space-y-5">
              {rooms.map((room) => (
                <div key={room.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    {room.name} ({room.roomNo}) · 容纳{room.capacity}人
                  </h3>
                  <RoomTimeline room={room} onSlotClick={handleTimelineSlotClick} />
                </div>
              ))}
            </div>
          )}

          {receptionView === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <Empty text="暂无订单" />
              ) : (
                orders
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order.id)}
                      className={classNames(
                        'bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md',
                        selectedOrderId === order.id
                          ? 'border-orange-500 ring-2 ring-orange-100'
                          : 'border-gray-200'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {order.roomName}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {order.orderNo}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {order.customerName} · {order.peopleCount}人
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {new Date(order.reserveStartTime).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {receptionView === 'staff' && (
            <div className="max-w-4xl mx-auto">
              <StaffShiftPanel />
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="w-[420px] border-l border-gray-200 bg-white flex flex-col">
          <OrderDetailPanel
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        </div>
      )}
    </div>
  );

  const renderCustomerView = () => (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCustomerView('rooms')}
              className={classNames(
                'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all',
                customerView === 'rooms'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              可订包厢
            </button>
            <button
              onClick={() => setCustomerView('myOrders')}
              className={classNames(
                'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all',
                customerView === 'myOrders'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <FileText className="w-4 h-4" />
              我的预订
            </button>
          </div>
          <button
            onClick={() => setShowCreateOrder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            立即预订
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {customerView === 'rooms' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {rooms
                .filter((r) => r.status !== 'maintenance')
                .map((room) => (
                  <div key={room.id} onClick={() => {
                    setDefaultRoomId(room.id);
                    setShowCreateOrder(true);
                  }}>
                    <RoomCard room={room} />
                  </div>
                ))}
            </div>
          )}

          {customerView === 'myOrders' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <Empty text="暂无预订记录" />
              ) : (
                orders
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order.id)}
                      className={classNames(
                        'bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md',
                        selectedOrderId === order.id
                          ? 'border-orange-500 ring-2 ring-orange-100'
                          : 'border-gray-200'
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {order.roomName}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {order.orderNo}
                          </span>
                        </div>
                      </div>
                      <StatusTimeline order={order} compact />
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="w-[420px] border-l border-gray-200 bg-white flex flex-col">
          <OrderDetailPanel
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        </div>
      )}
    </div>
  );

  const renderManagerView = () => (
    <div className="flex h-full">
      <div className="flex-1 min-w-0">
        <ManagerPanel />
      </div>
      {selectedOrder && (
        <div className="w-[420px] border-l border-gray-200 bg-white flex flex-col">
          <OrderDetailPanel
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        </div>
      )}
    </div>
  );

  const renderCashierView = () => (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const el = document.getElementById('cashier-main');
                if (el) el.style.display = '';
                const ex = document.getElementById('exception-panel');
                if (ex) ex.style.display = 'none';
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg"
            >
              <FileText className="w-4 h-4" />
              收银台
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('cashier-main');
                if (el) el.style.display = 'none';
                const ex = document.getElementById('exception-panel');
                if (ex) ex.style.display = '';
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              <AlertOctagon className="w-4 h-4" />
              异常审计
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('kitchen-panel');
                if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              <ChefHat className="w-4 h-4" />
              厨房备餐
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('waitlist-panel');
                if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              <Users className="w-4 h-4" />
              候补队列
            </button>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div id="cashier-main" className="flex-1 min-w-0">
            <CashierPanel />
          </div>
          <div id="exception-panel" className="flex-1 min-w-0" style={{ display: 'none' }}>
            <ExceptionPanel />
          </div>
        </div>
      </div>
      <div className="w-[380px] border-l border-gray-200 flex flex-col bg-gray-50 overflow-hidden">
        <div id="kitchen-panel" className="border-b border-gray-200" style={{ maxHeight: '50%' }}>
          <KitchenPanel />
        </div>
        <div id="waitlist-panel" className="flex-1 overflow-hidden">
          <WaitlistPanel />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Header />
      <div className="flex-1 overflow-hidden">{renderContent()}</div>

      <CreateOrderModal
        isOpen={showCreateOrder}
        onClose={() => setShowCreateOrder(false)}
        defaultRoomId={defaultRoomId}
        defaultStartTime={defaultStartTime}
      />
    </div>
  );
}
