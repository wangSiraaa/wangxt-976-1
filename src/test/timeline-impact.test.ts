import { useAppStore } from '../store/appStore';
import { mockOrders, mockOperationLogs, mockFinanceRecords, mockMenuItemStocks, mockRooms, mockStockLockRecords } from '../lib/mockData';
import type { OperationImpact } from '../types';

function runTests() {
  console.log('=== 时间轴操作影响回归测试 ===\n');

  const store = useAppStore.getState();

  console.log('--- 测试1: BX20240115001 订单操作影响验证 ---');
  const order001 = mockOrders.find(o => o.orderNo === 'BX20240115001');
  if (!order001) {
    console.log('✗ 找不到订单 BX20240115001');
    return;
  }
  console.log(`订单号: ${order001.orderNo}`);
  console.log(`包厢: ${order001.roomName}`);
  console.log(`人数: ${order001.peopleCount}`);
  console.log(`定金: ¥${order001.depositAmount}`);
  console.log('');

  const impacts = store.getOperationImpacts(order001.id);
  console.log(`操作影响记录数: ${impacts.length}`);

  const createOrderImpact = impacts.find(i => i.operationType === 'create_order');
  const payDepositImpact = impacts.find(i => i.operationType === 'pay_deposit');

  console.log('');
  console.log('【创建订单操作】');
  if (createOrderImpact) {
    console.log(`  operationType: ${createOrderImpact.operationType}`);
    console.log(`  roomImpact.capacityChange: ${createOrderImpact.roomImpact.capacityChange}`);
    console.log(`  roomImpact.capacityAfter: ${createOrderImpact.roomImpact.capacityAfter}`);
    console.log(`  kitchenImpact.prepTimeChange: ${createOrderImpact.kitchenImpact.prepTimeChange}`);
    console.log(`  financeImpact.amountChange: ${createOrderImpact.financeImpact.amountChange}`);
    console.log(`  financeImpact.direction: ${createOrderImpact.financeImpact.direction}`);

    const capacityCorrect = createOrderImpact.roomImpact.capacityChange === -order001.peopleCount;
    console.log(`  容量变化验证 (应为 -${order001.peopleCount}): ${capacityCorrect ? '✓ 通过' : '✗ 失败'}`);

    const financeCorrect = createOrderImpact.financeImpact.amountChange === 0 && createOrderImpact.financeImpact.direction === 'neutral';
    console.log(`  金额变化验证 (应为 0/neutral): ${financeCorrect ? '✓ 通过' : '✗ 失败'}`);
  } else {
    console.log('  ✗ 找不到 create_order 操作影响');
  }

  console.log('');
  console.log('【定金支付操作】');
  if (payDepositImpact) {
    console.log(`  operationType: ${payDepositImpact.operationType}`);
    console.log(`  roomImpact.capacityChange: ${payDepositImpact.roomImpact.capacityChange}`);
    console.log(`  kitchenImpact.prepTimeChange: ${payDepositImpact.kitchenImpact.prepTimeChange}`);
    console.log(`  financeImpact.amountChange: ${payDepositImpact.financeImpact.amountChange}`);
    console.log(`  financeImpact.direction: ${payDepositImpact.financeImpact.direction}`);

    const capacityCorrect = payDepositImpact.roomImpact.capacityChange === 0;
    console.log(`  容量变化验证 (应为 0): ${capacityCorrect ? '✓ 通过' : '✗ 失败'}`);

    const financeCorrect = payDepositImpact.financeImpact.amountChange === 200 && payDepositImpact.financeImpact.direction === 'in';
    console.log(`  金额变化验证 (应为 200/in, 即 +¥200): ${financeCorrect ? '✓ 通过' : '✗ 失败'}`);
  } else {
    console.log('  ✗ 找不到 pay_deposit 操作影响');
  }

  console.log('');
  console.log('--- 测试2: 字段名一致性验证 ---');

  const sampleImpact = impacts[0];
  const fieldChecks = [
    { field: 'operationType', exists: 'operationType' in sampleImpact },
    { field: 'roomImpact.capacityChange', exists: sampleImpact.roomImpact && 'capacityChange' in sampleImpact.roomImpact },
    { field: 'roomImpact.capacityAfter', exists: sampleImpact.roomImpact && 'capacityAfter' in sampleImpact.roomImpact },
    { field: 'kitchenImpact.prepTimeChange', exists: sampleImpact.kitchenImpact && 'prepTimeChange' in sampleImpact.kitchenImpact },
    { field: 'kitchenImpact.totalPrepTimeAfter', exists: sampleImpact.kitchenImpact && 'totalPrepTimeAfter' in sampleImpact.kitchenImpact },
    { field: 'financeImpact.amountChange', exists: sampleImpact.financeImpact && 'amountChange' in sampleImpact.financeImpact },
    { field: 'financeImpact.balanceAfter', exists: sampleImpact.financeImpact && 'balanceAfter' in sampleImpact.financeImpact },
    { field: 'financeImpact.direction', exists: sampleImpact.financeImpact && 'direction' in sampleImpact.financeImpact },
  ];

  fieldChecks.forEach(check => {
    console.log(`  ${check.field}: ${check.exists ? '✓ 存在' : '✗ 缺失'}`);
  });

  const allFieldsExist = fieldChecks.every(c => c.exists);
  console.log(`  字段完整性: ${allFieldsExist ? '✓ 全部通过' : '✗ 存在缺失'}`);

  console.log('');
  console.log('--- 测试3: 操作日志与财务记录时序验证 ---');
  const orderLogs = mockOperationLogs.filter(l => l.orderId === order001.id).sort((a, b) => a.timestamp - b.timestamp);
  const orderFinances = mockFinanceRecords.filter(f => f.orderId === order001.id).sort((a, b) => a.timestamp - b.timestamp);

  console.log(`  操作日志数: ${orderLogs.length}`);
  console.log(`  财务记录数: ${orderFinances.length}`);

  if (orderLogs.length >= 2 && orderFinances.length >= 1) {
    const createLog = orderLogs.find(l => l.type === 'create_order');
    const payLog = orderLogs.find(l => l.type === 'pay_deposit');
    const firstFinance = orderFinances[0];

    if (createLog && payLog && firstFinance) {
      const payAfterCreate = payLog.timestamp > createLog.timestamp;
      const financeMatchPay = Math.abs(firstFinance.timestamp - payLog.timestamp) < 60000;

      console.log(`  支付操作在创建之后: ${payAfterCreate ? '✓ 是' : '✗ 否'}`);
      console.log(`  财务记录与支付操作同时: ${financeMatchPay ? '✓ 是' : '✗ 否'}`);
    }
  }

  console.log('');
  console.log('=== 测试完成 ===');
}

runTests();
