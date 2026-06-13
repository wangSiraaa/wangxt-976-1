import { useAppStore } from '@/store/appStore';
import { classNames } from '@/lib/utils';
import { Calendar, Clock, Users, UserCheck, UserX } from 'lucide-react';

const shiftLabels: Record<string, { label: string; color: string }> = {
  morning: { label: '早班', color: 'bg-blue-100 text-blue-700' },
  afternoon: { label: '中班', color: 'bg-yellow-100 text-yellow-700' },
  evening: { label: '晚班', color: 'bg-purple-100 text-purple-700' },
  night: { label: '夜班', color: 'bg-gray-700 text-white' },
};

export default function StaffShiftPanel() {
  const { staffShifts, rooms } = useAppStore();

  const today = new Date().toISOString().split('T')[0];
  const todayShifts = staffShifts.filter((s) => s.date === today);
  const otherShifts = staffShifts.filter((s) => s.date !== today);

  const getRoomNames = (roomIds: string[]) => {
    return roomIds
      .map((id) => rooms.find((r) => r.id === id)?.name)
      .filter(Boolean)
      .join('、');
  };

  const totalOnDuty = todayShifts.length;
  const morningCount = todayShifts.filter((s) => s.shiftType === 'morning').length;
  const eveningCount = todayShifts.filter((s) => s.shiftType === 'evening').length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">服务员排班</h3>
              <p className="text-sm text-gray-500">今日排班一览</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-green-600">
              <UserCheck className="w-4 h-4" />
              <span>在岗 {totalOnDuty}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <UserX className="w-4 h-4" />
              <span>休息 {Math.max(0, 6 - totalOnDuty)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{morningCount}</p>
            <p className="text-xs text-blue-500">早班</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {todayShifts.filter((s) => s.shiftType === 'afternoon').length}
            </p>
            <p className="text-xs text-yellow-600">中班</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{eveningCount}</p>
            <p className="text-xs text-purple-500">晚班</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-600">
              {todayShifts.filter((s) => s.shiftType === 'night').length}
            </p>
            <p className="text-xs text-gray-500">夜班</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          {todayShifts.length === 0 && otherShifts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p>暂无排班记录</p>
            </div>
          ) : (
            <>
              {todayShifts.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    今日排班
                  </p>
                  <div className="space-y-2">
                    {todayShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                            {shift.staffName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {shift.staffName}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {getRoomNames(shift.roomIds) || '未分配包厢'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={classNames(
                              'px-2.5 py-1 rounded-full text-xs font-medium',
                              shiftLabels[shift.shiftType]?.color || 'bg-gray-100 text-gray-700'
                            )}
                          >
                            {shiftLabels[shift.shiftType]?.label || shift.shiftType}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            {shift.startTime} - {shift.endTime}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {otherShifts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-500 mb-2">其他日期排班</p>
                  <div className="space-y-2">
                    {otherShifts.slice(0, 3).map((shift) => (
                      <div
                        key={shift.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {shift.staffName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm text-gray-700">{shift.staffName}</p>
                            <p className="text-xs text-gray-400">{shift.date}</p>
                          </div>
                        </div>
                        <span
                          className={classNames(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            shiftLabels[shift.shiftType]?.color || 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {shiftLabels[shift.shiftType]?.label || shift.shiftType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
