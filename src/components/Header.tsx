import { useAppStore } from '@/store/appStore';
import type { RoleType } from '@/types';
import { classNames } from '@/lib/utils';
import { Users, BellRing, UserCircle, Wallet, ChefHat, RotateCcw } from 'lucide-react';

const roles: { value: RoleType; label: string; icon: typeof Users }[] = [
  { value: 'reception', label: '前台', icon: BellRing },
  { value: 'customer', label: '顾客', icon: UserCircle },
  { value: 'manager', label: '经理', icon: Users },
  { value: 'cashier', label: '收银', icon: Wallet },
];

export default function Header() {
  const { currentRole, currentUserName, setCurrentRole, resetAllData } = useAppStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 w-10 h-10 rounded-xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">餐饮包厢预订系统</h1>
            <p className="text-sm text-gray-500">Restaurant Private Room Booking</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">角色切换:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {roles.map((role) => {
                const Icon = role.icon;
                const isActive = currentRole === role.value;
                return (
                  <button
                    key={role.value}
                    onClick={() => setCurrentRole(role.value)}
                    className={classNames(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      isActive
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {role.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{currentUserName}</p>
              <p className="text-xs text-gray-500">
                当前角色: {roles.find((r) => r.value === currentRole)?.label}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
              {currentUserName.charAt(0)}
            </div>
          </div>

          <button
            onClick={resetAllData}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重置数据
          </button>
        </div>
      </div>
    </header>
  );
}
