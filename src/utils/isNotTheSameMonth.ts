import { isBefore, startOfMonth } from 'date-fns';

export default function isNotTheSameMonth(baseDate: Date, sendDate: Date) {
  const startMonthOfSendDate = startOfMonth(sendDate);
  const startMonthOfBaseDate = startOfMonth(baseDate);

  if (startMonthOfSendDate === startMonthOfBaseDate) return false;

  return isBefore(startMonthOfBaseDate, startMonthOfSendDate);
}
