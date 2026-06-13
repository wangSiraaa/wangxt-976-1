import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { classNames, formatCurrency, formatDateTime } from '@/lib/utils';
import { getStatusLabel, getStatusColor } from '@/lib/stateMachine';
import type { FinanceRecord } from '@/types';
import {
  Wallet,
  CreditCard,
  DollarSign,
  ArrowRightLeft,
  RefreshCw,
  Receipt,
  Users,
  Phone,
  CheckCircle,
  Undo2,
  FileText,
  Plus,
  Minus,
} from 'lucide-react';

const financeTypeLabels: Record<string, string> = {
  deposit_pay: '定金支付',
  deposit_deduct: '定金抵扣',
  deposit_refund: '定金退还',
  consumption: '消费金额',
  no_show_charge: '爽约扣款',
  cancel_charge: '取消扣款',
  late_charge: '迟到计费',
  coupon_discount: '优惠券抵扣',
  member_discount: '会员折扣',
  refund: '退款',
  reverse_charge: '冲正',
  split_account: '分账',
};

const directionLabels: Record<string, { label: string; color: string }> = {
  in: { label: '收入', color: 'text-green-600' },
  out: { label: '支出', color: 'text-red-600' },
};

const paymentMethodLabels: Record<string, string> = {
  cash: '现金',
  wechat: '微信',
  alipay: '支付宝',
  card: '银行卡',
  deposit: '定金抵扣',
};

export default function CashierPanel() {
  const {
    orders,
    financeRecords,
    setSelectedOrder,
    selectedOrderId,
    confirmArrival,
    confirmConsumption,
    deductDeposit,
    processRefund,
    reverseCharge,
    createInvoice,
    addFinanceRecord,
    calculateOrderAmount,
    deriveOrderAmountFromFinance,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'finance'>('orders');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [invoiceTaxNumber, setInvoiceTaxNumber] = useState('');
  const [invoiceType, setInvoiceType] = useState<'personal' | 'company'>('personal');

  const activeOrders = orders.filter((o) =>
    ['arrived', 'consuming', 'confirmed', 'locked', 'min_consumption_pending'].includes(o.status)
  );

  const recentFinance = [...financeRecords]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const orderFinance = financeRecords.filter((f) => f.orderId === selectedOrderId);

  const { total, discount, actual } = selectedOrder
    ? calculateOrderAmount(selectedOrder.id)
    : { total: 0, discount: 0, actual: 0 };

  const handleConfirmArrival = (orderId: string) => {
    if (confirm('确认顾客已到店？')) {
      confirmArrival(orderId);
    }
  };

  const handleConfirmConsumption = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    const msg = order?.status === 'arrived' ? '确认开始消费？' : '确认消费完成？';
    if (confirm(msg)) {
      confirmConsumption(orderId);
    }
  };

  const handleDeductDeposit = (orderId: string) => {
    if (confirm('确认使用定金抵扣消费金额？')) {
      deductDeposit(orderId);
    }
  };

  const handleRefund = () => {
    if (!selectedOrder || refundAmount <= 0) return;
    if (!refundReason.trim()) {
      alert('请填写退款原因');
      return;
    }
    processRefund(selectedOrder.id, refundAmount, refundReason);
    setShowRefundModal(false);
    setRefundAmount(0);
    setRefundReason('');
  };

  const handleReverseCharge = (recordId: string) => {
    if (!selectedOrder) return;
    const reason = prompt('请填写冲正原因');
    if (reason && reason.trim()) {
      reverseCharge(selectedOrder.id, recordId, reason);
    }
  };

  const handleIssueInvoice = () => {
    if (!selectedOrder || !invoiceTitle.trim()) return;
    const amount = actual || selectedOrder.actualAmount || selectedOrder.totalAmount;
    createInvoice(selectedOrder.id, {
      type: invoiceType,
      title: invoiceTitle,
      taxNumber: invoiceType === 'company' ? invoiceTaxNumber : undefined,
      amount: amount || selectedOrder.minConsumption,
    });
    setShowInvoiceModal(false);
    setInvoiceTitle('');
    setInvoiceTaxNumber('');
  };

  const handleAddConsumption = () => {
    if (!selectedOrder) return;
    const amountStr = prompt('请输入消费金额');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    addFinanceRecord(selectedOrder.id, 'consumption', amount, 'in', 'cash', '手动添加消费');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">收银台</h3>
              <p className="text-sm text-gray-500">消费确认与账务处理</p>
            </div>
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={classNames(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
              activeTab === 'orders' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            待处理订单
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={classNames(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
              activeTab === 'finance' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            账务流水
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'orders' ? (
          <div className="flex-1 overflow-hidden flex">
            <div className="w-80 border-r border-gray-100 overflow-y-auto">
              {activeOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p>暂无待处理订单</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order.id)}
                      className={classNames(
                        'p-4 cursor-pointer transition-colors',
                        selectedOrderId === order.id ? 'bg-green-50' : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{order.roomName}</span>
                        <span className={classNames('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(order.status))}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <Users className="w-3 h-3" />
                        <span>{order.customerName}</span>
                        <Phone className="w-3 h-3 ml-2" />
                        <span>{order.customerPhone}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{order.peopleCount}人</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(order.totalAmount || order.minConsumption)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!selectedOrder ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Receipt className="w-16 h-16 mx-auto mb-3 opacity-40" />
                    <p>请选择一个订单</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{selectedOrder.roomName}</h4>
                        <p className="text-sm text-gray-500">
                          订单号: {selectedOrder.orderNo}
                        </p>
                      </div>
                      <span className={classNames('px-3 py-1 rounded-full text-sm font-medium', getStatusColor(selectedOrder.status))}>
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">顾客姓名</p>
                        <p className="text-sm font-medium text-gray-900">{selectedOrder.customerName}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">联系电话</p>
                        <p className="text-sm font-medium text-gray-900">{selectedOrder.customerPhone}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">用餐人数</p>
                        <p className="text-sm font-medium text-gray-900">{selectedOrder.peopleCount} 人</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">预订时间</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDateTime(selectedOrder.reserveStartTime)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">消费明细</h5>

                    {selectedOrder.items.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.name} × {item.quantity}
                            </span>
                            <span className="text-gray-900 font-medium">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">消费总额</span>
                        <span className="font-medium text-gray-900">{formatCurrency(total || selectedOrder.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">最低消费</span>
                        <span className="font-medium text-gray-900">{formatCurrency(selectedOrder.minConsumption)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">优惠金额</span>
                          <span className="font-medium text-green-600">-{formatCurrency(discount || selectedOrder.discountAmount)}</span>
                        </div>
                      )}
                      {selectedOrder.depositPaid && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">已付定金</span>
                          <span className="font-medium text-blue-600">-{formatCurrency(selectedOrder.depositAmount)}</span>
                        </div>
                      )}
                      {selectedOrder.lateFee && selectedOrder.lateFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">迟到费用</span>
                          <span className="font-medium text-orange-600">+{formatCurrency(selectedOrder.lateFee)}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-gray-200 flex justify-between">
                        <span className="font-semibold text-gray-700">应付金额</span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatCurrency(actual || selectedOrder.actualAmount || selectedOrder.totalAmount || selectedOrder.minConsumption)}
                        </span>
                      </div>
                    </div>

                    {selectedOrderId && (
                      <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowRightLeft className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">流水推导金额</span>
                          <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">实时</span>
                        </div>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">定金收入</span>
                            <span className="text-green-600 font-medium">
                              +¥{deriveOrderAmountFromFinance(selectedOrderId).depositPaid.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">定金退还</span>
                            <span className="text-red-500 font-medium">
                              -¥{deriveOrderAmountFromFinance(selectedOrderId).depositRefunded.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">消费金额</span>
                            <span className="text-gray-700 font-medium">
                              ¥{deriveOrderAmountFromFinance(selectedOrderId).consumption.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">优惠抵扣</span>
                            <span className="text-orange-500 font-medium">
                              -¥{deriveOrderAmountFromFinance(selectedOrderId).discount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">迟到费用</span>
                            <span className="text-orange-600 font-medium">
                              +¥{deriveOrderAmountFromFinance(selectedOrderId).lateFee.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">取消费用</span>
                            <span className="text-orange-600 font-medium">
                              +¥{deriveOrderAmountFromFinance(selectedOrderId).cancelFee.toFixed(2)}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-green-200/50 flex justify-between">
                            <span className="font-medium text-green-800">当前余额</span>
                            <span className={classNames(
                              'font-bold',
                              deriveOrderAmountFromFinance(selectedOrderId).balance >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            )}>
                              ¥{deriveOrderAmountFromFinance(selectedOrderId).balance.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-green-600/70 mt-2">
                          * 所有金额均由账务流水记录自动推导，确保数据一致性
                        </p>
                      </div>
                    )}
                  </div>

                  {orderFinance.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">账务流水</h5>
                      <div className="space-y-2">
                        {orderFinance.map((record) => (
                          <FinanceRow
                            key={record.id}
                            record={record}
                            onReverse={() => handleReverseCharge(record.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">操作</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {['confirmed', 'locked', 'min_consumption_pending'].includes(selectedOrder.status) && (
                        <button
                          onClick={() => handleConfirmArrival(selectedOrder.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          确认到店
                        </button>
                      )}
                      {['arrived', 'consuming'].includes(selectedOrder.status) && (
                        <button
                          onClick={() => handleConfirmConsumption(selectedOrder.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <DollarSign className="w-4 h-4" />
                          {selectedOrder.status === 'arrived' ? '开始消费' : '完成消费'}
                        </button>
                      )}
                      {selectedOrder.depositPaid && selectedOrder.status === 'consuming' && (
                        <button
                          onClick={() => handleDeductDeposit(selectedOrder.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                          定金抵扣
                        </button>
                      )}
                      <button
                        onClick={handleAddConsumption}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        添加消费
                      </button>
                      <button
                        onClick={() => {
                          setRefundAmount(selectedOrder.depositAmount || 0);
                          setShowRefundModal(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Undo2 className="w-4 h-4" />
                        退款
                      </button>
                      <button
                        onClick={() => setShowInvoiceModal(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        开发票
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {recentFinance.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>暂无账务流水</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentFinance.map((record) => {
                  const order = orders.find((o) => o.id === record.orderId);
                  const dir = directionLabels[record.direction];
                  return (
                    <div key={record.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <div className={classNames(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            record.direction === 'in' ? 'bg-green-100' : 'bg-red-100'
                          )}>
                            {record.direction === 'in' ? (
                              <Plus className="w-4 h-4 text-green-600" />
                            ) : (
                              <Minus className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {financeTypeLabels[record.type] || record.type}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order?.roomName || record.orderId} · {formatDateTime(record.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={classNames('text-sm font-bold', dir.color)}>
                            {record.direction === 'in' ? '+' : '-'}{formatCurrency(record.amount)}
                          </p>
                          {record.paymentMethod && (
                            <p className="text-xs text-gray-500">
                              {paymentMethodLabels[record.paymentMethod] || record.paymentMethod}
                            </p>
                          )}
                        </div>
                      </div>
                      {record.remark && (
                        <p className="text-xs text-gray-500 ml-11">{record.remark}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              退款处理
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退款金额</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="请输入退款金额"
                />
                <p className="text-xs text-gray-500 mt-1">
                  已付定金: {formatCurrency(selectedOrder.depositAmount)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退款原因</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  placeholder="请填写退款原因"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundAmount(0);
                  setRefundReason('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleRefund}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                确认退款
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoiceModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              开具发票
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">发票类型</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setInvoiceType('personal')}
                    className={classNames(
                      'flex-1 py-2.5 border rounded-lg text-sm font-medium transition-colors',
                      invoiceType === 'personal'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    个人
                  </button>
                  <button
                    onClick={() => setInvoiceType('company')}
                    className={classNames(
                      'flex-1 py-2.5 border rounded-lg text-sm font-medium transition-colors',
                      invoiceType === 'company'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    企业
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {invoiceType === 'personal' ? '发票抬头' : '企业名称'}
                </label>
                <input
                  type="text"
                  value={invoiceTitle}
                  onChange={(e) => setInvoiceTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder={invoiceType === 'personal' ? '请输入姓名' : '请输入企业名称'}
                />
              </div>
              {invoiceType === 'company' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">税号</label>
                  <input
                    type="text"
                    value={invoiceTaxNumber}
                    onChange={(e) => setInvoiceTaxNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="请输入纳税人识别号"
                  />
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  开票金额: <span className="font-semibold text-gray-900">
                    {formatCurrency(actual || selectedOrder.actualAmount || selectedOrder.totalAmount || selectedOrder.minConsumption)}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoiceTitle('');
                  setInvoiceTaxNumber('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleIssueInvoice}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                确认开票
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FinanceRow({
  record,
  onReverse,
}: {
  record: FinanceRecord;
  onReverse: () => void;
}) {
  const dir = directionLabels[record.direction];
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm text-gray-900">{financeTypeLabels[record.type] || record.type}</p>
          <p className="text-xs text-gray-500">{formatDateTime(record.timestamp)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={classNames('text-sm font-semibold', dir.color)}>
          {record.direction === 'in' ? '+' : '-'}{formatCurrency(record.amount)}
        </span>
        {record.type !== 'reverse_charge' && (
          <button
            onClick={onReverse}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
            title="冲正"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
