import {
  getTimeSlotsForRoomAndDate,
  getTimeSlotsForDay,
  isTimeInPast,
  isSameDay,
  addDays,
  getDayLabel,
} from '../lib/utils';
import { mockRooms } from '../lib/mockData';

function runTests() {
  console.log('=== 预订时间选择逻辑测试 ===\n');

  const room = mockRooms[0];
  console.log(`测试包厢: ${room.name}`);
  console.log(`可订时段: ${room.bookableSlots.map(s => `${s.startTime}-${s.endTime}`).join(', ')}\n`);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  console.log('--- 测试1: 当天时间段生成 ---');
  const todaySlots = getTimeSlotsForRoomAndDate(room.bookableSlots, today, 30);
  console.log(`当天总时段数: ${todaySlots.length}`);
  if (todaySlots.length > 0) {
    console.log(`第一个时段: ${todaySlots[0].label}`);
    console.log(`最后一个时段: ${todaySlots[todaySlots.length - 1].label}`);
    const pastCount = todaySlots.filter(s => isTimeInPast(s.value)).length;
    console.log(`已过去的时段数: ${pastCount}`);
    const futureCount = todaySlots.filter(s => !isTimeInPast(s.value)).length;
    console.log(`可选择的未来时段数: ${futureCount}`);
  }
  console.log('');

  console.log('--- 测试2: 明天时间段生成 ---');
  const tomorrowSlots = getTimeSlotsForRoomAndDate(room.bookableSlots, tomorrow, 30);
  console.log(`明天总时段数: ${tomorrowSlots.length}`);
  if (tomorrowSlots.length > 0) {
    console.log(`第一个时段: ${tomorrowSlots[0].label}`);
    console.log(`最后一个时段: ${tomorrowSlots[tomorrowSlots.length - 1].label}`);
    const allFuture = tomorrowSlots.every(s => !isTimeInPast(s.value));
    console.log(`所有时段都在未来: ${allFuture ? '是 ✓' : '否 ✗'}`);
  }
  console.log('');

  console.log('--- 测试3: 验证不同包厢有不同的可订时段 ---');
  const room4 = mockRooms[3];
  console.log(`包厢4: ${room4.name}`);
  const room4TomorrowSlots = getTimeSlotsForRoomAndDate(room4.bookableSlots, tomorrow, 30);
  console.log(`明天总时段数: ${room4TomorrowSlots.length}`);
  if (room4TomorrowSlots.length > 0) {
    console.log(`最后一个时段: ${room4TomorrowSlots[room4TomorrowSlots.length - 1].label}`);
  }
  console.log('');

  console.log('--- 测试4: 晚间场景模拟（假设当前时间是23:00） ---');
  const lateNight = new Date(today);
  lateNight.setHours(23, 0, 0, 0);
  
  const lateNightTodaySlots = getTimeSlotsForRoomAndDate(room.bookableSlots, today, 30);
  const availableToday = lateNightTodaySlots.filter(s => s.value > lateNight.getTime());
  console.log(`23:00时当天可预订时段数: ${availableToday.length}`);
  console.log(`当天所有时段都已过: ${availableToday.length === 0 ? '是 ✓' : '否'}`);
  
  const lateNightTomorrowSlots = getTimeSlotsForRoomAndDate(room.bookableSlots, tomorrow, 30);
  const availableTomorrow = lateNightTomorrowSlots.filter(s => s.value > lateNight.getTime());
  console.log(`23:00时明天可预订时段数: ${availableTomorrow.length}`);
  console.log(`明天有可预订时段: ${availableTomorrow.length > 0 ? '是 ✓' : '否 ✗'}`);
  console.log('');

  console.log('--- 测试5: 日期标签生成 ---');
  console.log(`今天: ${getDayLabel(today)}`);
  console.log(`明天: ${getDayLabel(tomorrow)}`);
  console.log(`后天: ${getDayLabel(dayAfterTomorrow)}`);
  console.log('');

  console.log('--- 测试6: 基础工具函数 ---');
  console.log(`isSameDay(今天, 今天): ${isSameDay(today.getTime(), today.getTime()) ? '是 ✓' : '否 ✗'}`);
  console.log(`isSameDay(今天, 明天): ${!isSameDay(today.getTime(), tomorrow.getTime()) ? '否 ✓' : '是 ✗'}`);
  console.log(`addDays(今天, 1) = 明天: ${isSameDay(addDays(today.getTime(), 1), tomorrow.getTime()) ? '是 ✓' : '否 ✗'}`);
  console.log('');

  console.log('=== 测试完成 ===');
}

runTests();
