import dayjs from 'dayjs';
export function formatCommission(rate) {
    if (!rate && rate !== 0)
        return '--';
    if (rate > 1)
        return `${rate.toFixed(2).replace(/\.00$/, '')}%`;
    return `${(rate * 100).toFixed(2).replace(/\.00$/, '')}%`;
}
export function formatDateRange(start, end) {
    if (!start && !end)
        return '有效期未知';
    const startText = start ? dayjs(start).format('MM/DD HH:mm') : '即刻';
    const endText = end ? dayjs(end).format('MM/DD HH:mm') : '长期有效';
    return `${startText} - ${endText}`;
}
export function inferStatus(start, end) {
    const now = dayjs();
    const startTime = start ? dayjs(start) : null;
    const endTime = end ? dayjs(end) : null;
    if (startTime && now.isBefore(startTime)) {
        return 'upcoming';
    }
    if (endTime && now.isAfter(endTime)) {
        return 'offline';
    }
    if (startTime || endTime) {
        return 'online';
    }
    return 'unknown';
}
export function safeNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}
