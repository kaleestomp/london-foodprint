export const minuteToDate = (value: number) => {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    const result = new Date();
    result.setHours(hours, minutes, 0, 0);
    return result;
};

export const formatTime = (value: Date) => value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
});