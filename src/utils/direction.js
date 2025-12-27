const DIR_LABELS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

function normalizeAngle(angleRad) {
    while (angleRad < 0) angleRad += Math.PI * 2;
    while (angleRad >= Math.PI * 2) angleRad -= Math.PI * 2;
    return angleRad;
}

export function pointToDirection(x, y, options) {
    const { center, north, rotationDeg } = options;
    if (!north) return '-';
    const northAngle = Math.atan2(north.y - center.y, north.x - center.x);
    const ang = Math.atan2(y - center.y, x - center.x);
    const step = (Math.PI * 2) / 16;
    // Add half step offset so the sector is centered around the direction
    let rel = ang - northAngle - (rotationDeg || 0) * Math.PI / 180 + step / 2;
    rel = normalizeAngle(rel);
    const base = Math.floor(rel / step) % 16;
    return DIR_LABELS[base];
}

export function dominantDirectionForRect(rect, options) {
    const { center, north, rotationDeg } = options;
    if (!north) return '-';
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    return pointToDirection(cx, cy, { center, north, rotationDeg });
}
