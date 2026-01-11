export function formatCount(num: number): string {
    if (num < 10) {
        return `${num}`;
    }

    if (num < 1000) {
        return `${Math.floor(num / 10) * 10}+`;
    }

    if (num < 1_000_000) {
        const value = Math.floor(num / 100) / 10; // 1 decimal
        return `${value % 1 === 0 ? value.toFixed(0) : value}k`;
    }

    const value = Math.floor(num / 10_000) / 100; // 2 decimals
    return `${value % 1 === 0 ? value.toFixed(0) : value}M+`;
}