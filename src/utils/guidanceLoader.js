function splitList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean).map(s => s.trim());
    return value
        .split('|')
        .map(s => s.trim())
        .filter(Boolean);
}

function normalizeZone(zone) {
    if (!zone) return 'Neutral';
    const z = zone.trim().toLowerCase();
    if (z === 'very bad') return 'Very Bad';
    if (z === 'bad') return 'Bad';
    if (z === 'good') return 'Good';
    if (z === 'best') return 'Best';
    return zone;
}

const normalizeDirKey = (raw) => {
    if (!raw) return '';
    let s = raw.trim();
    const paren = s.match(/\(([^)]+)\)/);
    if (paren && paren[1]) {
        return paren[1].trim().toUpperCase();
    }
    s = s.replace(/,/g, '');
    s = s.replace(/\s*-\s*/g, '-');
    s = s.replace(/\s+/g, ' ').trim().toUpperCase();
    const mapNames = {
        'NORTH': 'N',
        'NORTH-NORTHEAST': 'NNE',
        'NORTHEAST': 'NE',
        'EAST-NORTHEAST': 'ENE',
        'EAST': 'E',
        'EAST-SOUTHEAST': 'ESE',
        'SOUTHEAST': 'SE',
        'SOUTH-SOUTHEAST': 'SSE',
        'SOUTH': 'S',
        'SOUTH-SOUTHWEST': 'SSW',
        'SOUTHWEST': 'SW',
        'WEST-SOUTHWEST': 'WSW',
        'WEST': 'W',
        'WEST-NORTHWEST': 'WNW',
        'NORTHWEST': 'NW',
        'NORTH-NORTHWEST': 'NNW',
    };
    return mapNames[s] || s.toUpperCase();
};

export async function loadGuidanceFromLocal(dataModules) {
    const map = {};
    for (const [path, mod] of Object.entries(dataModules)) {
        try {
            const fileName = path.split('/').pop().replace('.json', '');
            const obj = mod.default || mod;
            const entries = {};
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    const rawDir = (item.compass_direction || item.direction || '').toString();
                    const key = normalizeDirKey(rawDir);
                    if (!key) continue;
                    entries[key] = {
                        zone: normalizeZone(item.zone),
                        element: (item.element || '').toString(),
                        remedies_primary: splitList(item.remedies_primary),
                        remedies_secondary: splitList(item.remedies_secondary),
                        effect: splitList(item.effect),
                    };
                }
            } else {
                for (const [dir, val] of Object.entries(obj || {})) {
                    const key = normalizeDirKey(String(dir));
                    entries[key] = {
                        zone: normalizeZone(val.zone),
                        element: val.element || '',
                        remedies_primary: splitList(val.remedies_primary),
                        remedies_secondary: splitList(val.remedies_secondary),
                        effect: splitList(val.effect),
                    };
                }
            }
            map[fileName] = entries;
        } catch { }
    }
    return map;
}
