import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import {
  classNames,
  formatCurrency,
  formatDateTime,
  getTimeSlotsForRoomAndDate,
  getDayLabel,
  isTimeInPast,
  isSameDay,
} from '@/lib/utils';
import Modal from './Modal';
import type { Room } from '@/types';
import {
  Users,
  Phone,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRoomId?: string;
  defaultStartTime?: number;
}

export default function CreateOrderModal({
  isOpen,
  onClose,
  defaultRoomId,
  defaultStartTime,
}: CreateOrderModalProps) {
  const { rooms, createOrder, checkRoomAvailable, currentRole, currentUserName, lockRecords } = useAppStore();

  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [peopleCount, setPeopleCount] = useState(4);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<number>(0);
  const [duration, setDuration] = useState(120);
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availabilityOk, setAvailabilityOk] = useState<boolean | null>(null);
  const [lockConflict, setLockConflict] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const firstAvailableRoom = rooms.find((r) => r.status !== 'maintenance');
      setSelectedRoomId(defaultRoomId || firstAvailableRoom?.id || '');
      
      const today = new Date();
      setSelectedDate(today);
      
      if (defaultStartTime) {
        setStartTime(defaultStartTime);
        setSelectedDate(new Date(defaultStartTime));
      } else {
        setStartTime(0);
      }
      
      setCustomerName(currentRole === 'customer' ? currentUserName : '');
      setCustomerPhone('');
      setPeopleCount(4);
      setDuration(120);
      setRemark('');
      setError('');
      setAvailabilityOk(null);
      setLockConflict(false);
    }
  }, [isOpen, defaultRoomId, defaultStartTime, rooms, currentRole, currentUserName]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const endTime = startTime ? startTime + duration * 60 * 1000 : 0;

  const timeSlots = useMemo(() => {
    if (!selectedRoom) return [];
    return getTimeSlotsForRoomAndDate(selectedRoom.bookableSlots, selectedDate, 30);
  }, [selectedRoom, selectedDate]);

  const dateOptions = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  useEffect(() => {
    if (!selectedRoomId || !startTime) return;
    
    setChecking(true);
    setAvailabilityOk(null);
    setLockConflict(false);
    
    const timer = setTimeout(() => {
      const end = startTime + duration * 60 * 1000;
      const ok = checkRoomAvailable(selectedRoomId, startTime, end);
      setAvailabilityOk(ok);
      
      const hasLockConflict = lockRecords.some(
        (lock) =>
          lock.roomId === selectedRoomId &&
          lock.endTime > Date.now() &&
          startTime < lock.endTime &&
          end > lock.startTime
      );
      setLockConflict(hasLockConflict);
      
      setChecking(false);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [selectedRoomId, startTime, duration, checkRoomAvailable, lockRecords]);

  useEffect(() => {
    if (timeSlots.length > 0 && !startTime) {
      const firstAvailable = timeSlots.find((slot) => !isTimeInPast(slot.value));
      if (firstAvailable) {
        setStartTime(firstAvailable.value);
      } else if (timeSlots.length > 0 && !isSameDay(selectedDate.getTime(), Date.now())) {
        setStartTime(timeSlots[0].value);
      }
    }
  }, [timeSlots, startTime, selectedDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setStartTime(0);
    setAvailabilityOk(null);
    setLockConflict(false);
  };

  const handlePrevDay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate.getTime() > today.getTime()) {
      const prevDate = new Date(selectedDate);
      prevDate.setDate(prevDate.getDate() - 1);
      handleDateChange(prevDate);
    }
  };

  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 6);
    if (nextDate <= maxDate) {
      handleDateChange(nextDate);
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!selectedRoomId) {
      setError('请选择包厢');
      return;
    }
    if (!customerName.trim()) {
      setError('请填写顾客姓名');
      return;
    }
    if (!customerPhone.trim()) {
      setError('请填写联系电话');
      return;
    }
    if (!startTime) {
      setError('请选择预订时间');
      return;
    }
    if (selectedRoom && peopleCount > selectedRoom.capacity) {
      setError(`人数超过包厢容量（最大${selectedRoom.capacity}人）`);
      return;
    }
    if (lockConflict) {
      setError('该时间段包厢被锁定，请选择其他时间或联系管理员');
      return;
    }
    if (!availabilityOk) {
      setError('该时间段已被预订，请选择其他时间或包厢');
      return;
    }
    if (isTimeInPast(startTime)) {
      setError('预订时间不能早于当前时间');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const result = createOrder({
        roomId: selectedRoomId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        peopleCount,
        reserveStartTime: startTime,
        reserveEndTime: endTime,
        remark: remark.trim(),
      });

      if (!result.success) {
        setError(result.error || '创建订单失败');
        return;
      }

      onClose();
    } finally {
      setLoading(false);
    }
  };

  const availableRooms = rooms.filter((r) => r.status !== 'maintenance');

  const isToday = isSameDay(selectedDate.getTime(), Date.now());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="新建预订"
      size="lg"
      footer={
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {selectedRoom && (
              <span>
                定金: <span className="font-semibold text-gray-900">{formatCurrency(selectedRoom.depositAmount)}</span>
                {' · '}
                最低消费: <span className="font-semibold text-gray-900">{formatCurrency(selectedRoom.minConsumption)}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !availabilityOk || lockConflict}
              className="px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  创建中
                </>
              ) : (
                '确认创建'
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择包厢 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {availableRooms.map((room) => (
              <RoomOption
                key={room.id}
                room={room}
                selected={selectedRoomId === room.id}
                onClick={() => {
                  setSelectedRoomId(room.id);
                  setStartTime(0);
                  setAvailabilityOk(null);
                  setLockConflict(false);
                }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              顾客姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="请输入姓名"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              联系电话 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="请输入手机号"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              用餐人数
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                −
              </button>
              <input
                type="number"
                value={peopleCount}
                onChange={(e) => setPeopleCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setPeopleCount(peopleCount + 1)}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
              {selectedRoom && peopleCount > selectedRoom.capacity && (
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  超出容量
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              用餐时长
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value={60}>1 小时</option>
              <option value={90}>1.5 小时</option>
              <option value={120}>2 小时</option>
              <option value={180}>3 小时</option>
              <option value={240}>4 小时</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            预订日期 <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={handlePrevDay}
              disabled={isToday}
              className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1">
              {dateOptions.map((date) => {
                const isSelected = isSameDay(date.getTime(), selectedDate.getTime());
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                return (
                  <button
                    key={date.getTime()}
                    type="button"
                    onClick={() => handleDateChange(date)}
                    disabled={isPast}
                    className={classNames(
                      'flex-shrink-0 px-3 py-2 rounded-lg text-xs transition-colors min-w-[60px]',
                      isPast
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isSelected
                        ? 'bg-orange-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-300 hover:text-orange-600'
                    )}
                  >
                    <div className="font-medium">{getDayLabel(date)}</div>
                    <div className="text-[10px] opacity-80">
                      {date.getMonth() + 1}/{date.getDate()}
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleNextDay}
              disabled={selectedDate.getTime() >= dateOptions[dateOptions.length - 1].getTime()}
              className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            开始时间 <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-gray-50 rounded-lg">
            {timeSlots.length === 0 ? (
              <p className="text-sm text-gray-500 px-2 py-3">该日期暂无可预订时段</p>
            ) : (
              timeSlots.map((slot) => {
                const isSelected = startTime === slot.value;
                const isPast = isToday && isTimeInPast(slot.value);
                return (
                  <button
                    key={slot.value}
                    type="button"
                    disabled={isPast}
                    onClick={() => setStartTime(slot.value)}
                    className={classNames(
                      'px-3 py-1.5 text-xs rounded-md transition-colors',
                      isPast
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isSelected
                        ? 'bg-orange-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-300 hover:text-orange-600'
                    )}
                  >
                    {slot.label}
                  </button>
                );
              })
            )}
          </div>
          {startTime && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg mt-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span>
                预订时段: {formatDateTime(startTime)} - {formatDateTime(endTime)}
              </span>
              {checking ? (
                <span className="ml-auto flex items-center gap-1 text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  检查中
                </span>
              ) : lockConflict ? (
                <span className="ml-auto flex items-center gap-1 text-orange-600">
                  <Lock className="w-4 h-4" />
                  已被锁定
                </span>
              ) : availabilityOk === true ? (
                <span className="ml-auto flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  时段可用
                </span>
              ) : availabilityOk === false ? (
                <span className="ml-auto flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  已被预订
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="特殊要求、忌口等"
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}

function RoomOption({
  room,
  selected,
  onClick,
}: {
  room: Room;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'text-left p-3 rounded-xl border-2 transition-all',
        selected
          ? 'border-orange-500 bg-orange-50'
          : 'border-gray-200 bg-white hover:border-orange-200'
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-gray-900">{room.name}</span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{room.roomNo}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {room.capacity}人
        </span>
        <span>{formatCurrency(room.minConsumption)}起</span>
      </div>
    </button>
  );
}
