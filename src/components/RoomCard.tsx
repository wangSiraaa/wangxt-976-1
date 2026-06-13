import { useAppStore } from '@/store/appStore';
import type { Room, RoomStatus } from '@/types';
import { classNames, formatCurrency } from '@/lib/utils';
import { Users, CircleDollarSign, Lock, Wifi, Tv, Coffee, Bath } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onClick?: () => void;
  selected?: boolean;
}

const statusConfig: Record<RoomStatus, { label: string; color: string; dotColor: string }> = {
  available: { label: '空闲', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
  locked: { label: '锁包中', color: 'bg-orange-100 text-orange-700', dotColor: 'bg-orange-500' },
  reserved: { label: '已预订', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' },
  occupied: { label: '使用中', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' },
  maintenance: { label: '维护中', color: 'bg-gray-100 text-gray-700', dotColor: 'bg-gray-500' },
};

const tableTypeLabels: Record<string, string> = {
  round: '圆桌',
  square: '方桌',
  rectangle: '长桌',
  private: '私人定制',
};

const facilityIcons: Record<string, typeof Users> = {
  '独立卫生间': Bath,
  '休息沙发': Coffee,
  '电视': Tv,
  '音响': Wifi,
  '茶台': Coffee,
};

export default function RoomCard({ room, onClick, selected }: RoomCardProps) {
  const { getRoomBookings, lockRecords } = useAppStore();
  const status = statusConfig[room.status];
  const bookings = getRoomBookings(room.id).filter((o) =>
    ['confirmed', 'locked', 'min_consumption_pending', 'arrived', 'consuming'].includes(o.status)
  );
  const activeLock = lockRecords.find((l) => l.roomId === room.id && l.endTime > Date.now());

  return (
    <div
      onClick={onClick}
      className={classNames(
        'bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg',
        selected
          ? 'border-orange-500 shadow-lg ring-4 ring-orange-100'
          : 'border-gray-100 hover:border-orange-200'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">{room.name}</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {room.roomNo}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {tableTypeLabels[room.tableType]} · {room.area} · {room.floor}楼
          </p>
        </div>
        <div className={classNames('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', status.color)}>
          <span className={classNames('w-2 h-2 rounded-full animate-pulse', status.dotColor)} />
          {status.label}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{room.capacity}</p>
          <p className="text-xs text-gray-500">容纳人数</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <CircleDollarSign className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{formatCurrency(room.minConsumption)}</p>
          <p className="text-xs text-gray-500">最低消费</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <Lock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{formatCurrency(room.depositAmount)}</p>
          <p className="text-xs text-gray-500">预订定金</p>
        </div>
      </div>

      {bookings.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-700 mb-2">今日预订 ({bookings.length})</p>
          <div className="space-y-1.5">
            {bookings.slice(0, 2).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-1.5">
                <span className="text-gray-600">{booking.customerName}</span>
                <span className="text-gray-500">
                  {new Date(booking.reserveStartTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(booking.reserveEndTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {bookings.length > 2 && (
              <p className="text-xs text-gray-400 text-center">还有 {bookings.length - 2} 个预订</p>
            )}
          </div>
        </div>
      )}

      {activeLock && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-xs font-medium text-orange-700">临时锁包</p>
              <p className="text-xs text-orange-600">
                {activeLock.reason} · 锁至 {new Date(activeLock.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {room.facilities.slice(0, 5).map((facility) => {
          const Icon = facilityIcons[facility] || Coffee;
          return (
            <span
              key={facility}
              className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
            >
              <Icon className="w-3 h-3" />
              {facility}
            </span>
          );
        })}
      </div>
    </div>
  );
}
