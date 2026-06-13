import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { classNames, formatCurrency, formatDateTime, getTimeSlotsForDay } from '@/lib/utils';
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
  const { rooms, createOrder, checkRoomAvailable, currentRole, currentUserName } = useAppStore();

  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [peopleCount, setPeopleCount] = useState(4);
  const [startTime, setStartTime] = useState<number>(0);
  const [duration, setDuration] = useState(120);
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availabilityOk, setAvailabilityOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedRoomId(defaultRoomId || rooms[0]?.id || '');
      const now = Date.now();
      const rounded = Math.ceil(now / 1800000) * 1800000;
      setStartTime(defaultStartTime || rounded);
      setCustomerName(currentRole === 'customer' ? currentUserName : '');
      setCustomerPhone('');
      setPeopleCount(4);
      setDuration(120);
      setRemark('');
      setError('');
      setAvailabilityOk(null);
    }
  }, [isOpen, defaultRoomId, defaultStartTime, rooms, currentRole, currentUserName]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const endTime = startTime ? startTime + duration * 60 * 1000 : 0;

  useEffect(() => {
    if (!selectedRoomId || !startTime) return;
    setChecking(true);
    setAvailabilityOk(null);
    const timer = setTimeout(() => {
      const ok = checkRoomAvailable(selectedRoomId, startTime, startTime + duration * 60 * 1000);
      setAvailabilityOk(ok);
      setChecking(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedRoomId, startTime, duration, checkRoomAvailable]);

  const timeSlots = getTimeSlotsForDay('11:00', '22:00', 30);

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
    if (!availabilityOk) {
      setError('该时间段已被预订，请选择其他时间或包厢');
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
              disabled={loading || !availabilityOk}
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
                onClick={() => setSelectedRoomId(room.id)}
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
            预订时间 <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1.5">开始时间</p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                {timeSlots.map((slot) => {
                  const isSelected = startTime === slot.value;
                  const isPast = slot.value < Date.now();
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
                })}
              </div>
            </div>
          </div>
          {startTime && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
              <Info className="w-4 h-4 text-blue-500" />
              <span>
                预订时段: {formatDateTime(startTime)} - {formatDateTime(endTime)}
              </span>
              {checking ? (
                <span className="ml-auto flex items-center gap-1 text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  检查中
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
