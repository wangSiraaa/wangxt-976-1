import { useAppStore } from '@/store/appStore';
import { classNames, formatTime, formatCountdown } from '@/lib/utils';
import { useCountdown } from '@/hooks/useCountdown';
import { Clock, Users, Phone, UserPlus, CheckCircle, XCircle, Crown } from 'lucide-react';
import type { WaitlistRecord } from '@/types';

export default function WaitlistPanel() {
  const { waitlist, promoteWaitlist, cancelWaitlist, rooms } = useAppStore();

  const waitingList = waitlist
    .filter((w) => w.status === 'waiting')
    .sort((a, b) => a.queuePosition - b.queuePosition);

  const promotedList = waitlist
    .filter((w) => w.status === 'promoted')
    .sort((a, b) => b.createdAt - a.createdAt);

  const availableRooms = rooms.filter((r) => r.status === 'available');

  const handlePromote = (waitlistId: string) => {
    if (availableRooms.length === 0) {
      alert('暂无可分配的包厢');
      return;
    }
    const roomId = prompt('请输入要分配的包厢ID', availableRooms[0].id);
    if (roomId && availableRooms.some((r) => r.id === roomId)) {
      promoteWaitlist(waitlistId, roomId);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">候补队列</h3>
              <p className="text-sm text-gray-500">{waitingList.length} 人在等待</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              {promotedList.length} 人已分配
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {waitingList.length === 0 && promotedList.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p>暂无候补顾客</p>
          </div>
        ) : (
          <div className="space-y-3">
            {waitingList.map((record) => (
              <WaitlistItem
                key={record.id}
                record={record}
                isTop={record.queuePosition === 1}
                onPromote={() => handlePromote(record.id)}
                onCancel={() => cancelWaitlist(record.id)}
              />
            ))}

            {promotedList.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">最近分配</p>
                <div className="space-y-2">
                  {promotedList.slice(0, 3).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.customerName}</p>
                          <p className="text-xs text-gray-500">
                            {record.peopleCount}人 · {record.phone}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-green-600 font-medium">已分配</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WaitlistItem({
  record,
  isTop,
  onPromote,
  onCancel,
}: {
  record: WaitlistRecord;
  isTop: boolean;
  onPromote: () => void;
  onCancel: () => void;
}) {
  const expireCountdown = useCountdown(record.expireTime);
  const isExpiring = expireCountdown < 300;

  return (
    <div
      className={classNames(
        'border rounded-xl p-4 transition-all',
        isTop ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
              {record.customerName.charAt(0)}
            </div>
            {isTop && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">{record.customerName}</p>
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                #{record.queuePosition}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Phone className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">{record.phone}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-700">{record.peopleCount}人</span>
          </div>
          {record.roomTypePreference && (
            <p className="text-xs text-gray-500 mt-0.5">偏好: {record.roomTypePreference}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-1 text-gray-500">
          <Clock className="w-3 h-3" />
          <span>目标时间: {formatTime(record.targetTime)}</span>
        </div>
        <div className={classNames('flex items-center gap-1', isExpiring ? 'text-red-500' : 'text-gray-500')}>
          <span>过期:</span>
          <span className={classNames('font-mono', isExpiring && 'animate-pulse')}>
            {formatCountdown(expireCountdown)}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onPromote}
          className="flex-1 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-1"
        >
          <UserPlus className="w-4 h-4" />
          安排包厢
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
