import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import type { Room, Order } from '@/types';
import { classNames, formatTime, formatDate, getTimeDiff, formatCountdown } from '@/lib/utils';
import { Clock, AlertTriangle, Lock } from 'lucide-react';

interface RoomTimelineProps {
  room: Room;
  onSlotClick?: (roomId: string, startTime: number, endTime: number) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 9); 

export default function RoomTimeline({ room, onSlotClick }: RoomTimelineProps) {
  const { lockRecords, getRoomBookings } = useAppStore();
  const [hoveredSlot, setHoveredSlot] = useState<{ start: number; end: number } | null>(null);

  const dayStart = useMemo(() => {
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    return today.getTime();
  }, []);

  const dayEnd = useMemo(() => {
    const today = new Date();
    today.setHours(22, 0, 0, 0);
    return today.getTime();
  }, []);

  const pxPerHour = 60;
  const totalWidth = HOURS.length * pxPerHour;

  const bookings = useMemo(() => {
    return getRoomBookings(room.id).filter((o) =>
      ['confirmed', 'locked', 'min_consumption_pending', 'arrived', 'consuming'].includes(o.status)
    );
  }, [room.id, getRoomBookings]);

  const activeLocks = useMemo(() => {
    return lockRecords.filter((l) => l.roomId === room.id && l.endTime > Date.now());
  }, [room.id, lockRecords]);

  const getPosition = useCallback((time: number) => {
    const hours = (time - dayStart) / (1000 * 60 * 60);
    return Math.max(0, Math.min(totalWidth, (hours - 9) * pxPerHour));
  }, [dayStart, totalWidth]);

  const getWidth = useCallback((startTime: number, endTime: number) => {
    return Math.max(0, getPosition(endTime) - getPosition(startTime));
  }, [getPosition]);

  const renderBlocks = useMemo(() => {
    const blocks: Array<{
      id: string;
      start: number;
      end: number;
      left: number;
      width: number;
      type: 'booking' | 'lock';
      data?: unknown;
    }> = [];

    bookings.forEach((order) => {
      const start = Math.max(dayStart, order.reserveStartTime);
      const end = Math.min(dayEnd, order.reserveEndTime);
      if (start >= end) return;
      blocks.push({
        id: order.id,
        start,
        end,
        left: getPosition(start),
        width: getWidth(start, end),
        type: 'booking',
        data: order,
      });
    });

    activeLocks.forEach((lock) => {
      const start = Math.max(dayStart, lock.startTime);
      const end = Math.min(dayEnd, lock.endTime);
      if (start >= end) return;
      blocks.push({
        id: lock.id,
        start,
        end,
        left: getPosition(start),
        width: getWidth(start, end),
        type: 'lock',
        data: lock,
      });
    });

    return blocks.sort((a, b) => a.left - b.left);
  }, [bookings, activeLocks, dayStart, dayEnd, getPosition, getWidth]);

  const checkConflict = (start: number, end: number) => {
    return renderBlocks.some(
      (block) => block.start < end && start < block.end
    );
  };

  const handleSlotClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSlotClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const hourIndex = Math.floor(x / pxPerHour);
    const hour = 9 + hourIndex;
    const startTime = dayStart + hour * 60 * 60 * 1000;
    const endTime = startTime + 2 * 60 * 60 * 1000;

    const hasConflict = checkConflict(startTime, endTime);
    if (hasConflict) {
      alert('该时间段已被占用！');
      return;
    }
    onSlotClick(room.id, startTime, endTime);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSlotClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const hourIndex = Math.floor(x / pxPerHour);
    const hour = 9 + hourIndex;
    const startTime = dayStart + hour * 60 * 60 * 1000;
    const endTime = startTime + 2 * 60 * 60 * 1000;
    setHoveredSlot({ start: startTime, end: endTime });
  };

  const handleMouseLeave = () => {
    setHoveredSlot(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{room.name} 时间轴</h3>
            <p className="text-sm text-gray-500">{formatDate(Date.now())}</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-gray-600">已预订</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-gray-600">锁包中</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500" />
              <span className="text-gray-600">使用中</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="relative">
          {/* 时间刻度 */}
          <div className="flex border-b border-gray-200 mb-2">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="flex-shrink-0 w-[60px] text-center text-xs text-gray-500 py-1"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* 时间轴区域 */}
          <div
            className="relative h-20 bg-gray-50 rounded-lg cursor-pointer select-none"
            onClick={handleSlotClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* 当前时间线 */}
            {Date.now() >= dayStart && Date.now() <= dayEnd && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                style={{ left: `${getPosition(Date.now())}px` }}
              >
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
              </div>
            )}

            {/* 悬停预览 */}
            {hoveredSlot && onSlotClick && (
              <div
                className={classNames(
                  'absolute top-1 bottom-1 rounded-md border-2 transition-opacity z-10',
                  checkConflict(hoveredSlot.start, hoveredSlot.end)
                    ? 'bg-red-100 border-red-300 opacity-50'
                    : 'bg-green-100 border-green-300 opacity-70'
                )}
                style={{
                  left: `${getPosition(hoveredSlot.start)}px`,
                  width: `${getWidth(hoveredSlot.start, hoveredSlot.end)}px`,
                }}
              >
                {checkConflict(hoveredSlot.start, hoveredSlot.end) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </div>
            )}

            {/* 预订和锁包块 */}
            {renderBlocks.map((block) => {
              const order = block.type === 'booking' ? (block.data as Order) : null;
              const lock = block.type === 'lock' ? (block.data as typeof activeLocks[0]) : null;

              const baseClasses = block.type === 'lock'
                ? 'bg-orange-500'
                : order?.status === 'consuming'
                ? 'bg-red-500'
                : order?.status === 'arrived'
                ? 'bg-purple-500'
                : 'bg-blue-500';

              return (
                <div
                  key={block.id}
                  className={classNames(
                    'absolute top-1 bottom-1 rounded-lg px-2 py-1 text-white text-xs font-medium overflow-hidden transition-all hover:brightness-110 cursor-pointer z-10',
                    baseClasses
                  )}
                  style={{
                    left: `${block.left}px`,
                    width: `${Math.max(block.width, 60)}px`,
                  }}
                >
                  <div className="flex items-center gap-1 h-full">
                    {block.type === 'lock' && <Lock className="w-3 h-3 flex-shrink-0" />}
                    <div className="truncate">
                      {block.type === 'booking'
                        ? `${order?.customerName}`
                        : `${lock?.reason}`}
                    </div>
                    {block.type === 'booking' && order?.status === 'consuming' && (
                      <span className="text-[10px] bg-white/20 px-1 rounded">用餐中</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 空闲时段格子背景 */}
            <div className="absolute inset-0 flex">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex-shrink-0 w-[60px] border-r border-gray-200 last:border-r-0"
                />
              ))}
            </div>
          </div>
        </div>

        {/* 即将到期的预订 */}
        {bookings.some((o) => o.status === 'confirmed' && o.reserveExpireTime) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">即将到期</span>
          </div>
            <div className="mt-2 space-y-1">
              {bookings
                .filter((o) => o.status === 'confirmed' && o.reserveExpireTime)
                .slice(0, 2)
                .map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-xs text-yellow-700">
                    <span>{order.customerName} - {formatTime(order.reserveStartTime)}</span>
                    <span className="font-mono">
                      {formatCountdown(getTimeDiff(order.reserveExpireTime!))}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
