export const DISTRICT_SIZE = 620;
export const WORLD_HALF = 2480;
export const ROAD_LIMIT = 2380;
export const ROAD_AXES = [-2320, -1860, -1240, -620, 0, 620, 1240, 1860, 2320];
export const DISTRICT_LAYOUT = [
  [13, 13, 14, 13, 14, 13, 13, 13],
  [13, 12, 3, 9, 5, 12, 3, 14],
  [14, 1, 1, 2, 6, 9, 12, 13],
  [13, 4, 1, 0, 1, 2, 7, 14],
  [14, 11, 10, 1, 1, 5, 11, 13],
  [13, 12, 9, 2, 6, 3, 12, 14],
  [16, 3, 12, 11, 7, 10, 12, 15],
  [13, 14, 16, 13, 15, 13, 16, 13]
];

export function districtAt(x, z) {
  const ix = Math.max(0, Math.min(7, Math.floor((x + WORLD_HALF) / DISTRICT_SIZE)));
  const iz = Math.max(0, Math.min(7, Math.floor((z + WORLD_HALF) / DISTRICT_SIZE)));
  return { ix, iz, type: DISTRICT_LAYOUT[iz][ix] };
}

export function sectorKey(x, z) {
  const { ix, iz, type } = districtAt(x, z);
  if (type === 15) return '4,4';
  if (type === 16) return '5,5';
  if (ix === 0 || ix === 7 || iz === 0 || iz === 7) return '3,3';
  return `${Math.floor((ix - 1) / 2)},${Math.floor((iz - 1) / 2)}`;
}

// Relay positions live on protected road intersections, never inside a landmark.
export const RELAYS = [
  { id: 'core', name: 'CORE JUNCTION', x: 0, z: -620, color: '#ff4268' },
  { id: 'archive', name: 'ARCHIVE RUN', x: 1240, z: -1240, color: '#c19aff' },
  { id: 'forge', name: 'FORGE CROSSING', x: 1860, z: 0, color: '#ffa25d' },
  { id: 'rift', name: 'ARES RIFT', x: 2320, z: 1860, color: '#c19aff' },
  { id: 'uplink', name: 'I/O TOWER APPROACH', x: 1860, z: 2320, color: '#77f5ff' },
  { id: 'frontier', name: 'OUTLANDS RUN', x: 0, z: 2320, color: '#ff94b4' },
  { id: 'west', name: 'WESTERN WATCH', x: -2320, z: 1240, color: '#77f5ff' },
  { id: 'return', name: 'CYAN GATE', x: -1240, z: -1240, color: '#77f5ff' }
];

export function insideZone(point, zone, margin = 0) {
  return !zone || (point.x >= zone.minX + margin && point.x <= zone.maxX - margin &&
    point.z >= zone.minZ + margin && point.z <= zone.maxZ - margin);
}

// Axis-aligned roads form a connected graph. Return a driveable waypoint, not
// a straight arrow through buildings. Diagonal shortcut only on the same node.
export function routeToRelay(position, target) {
  const nearest = value => ROAD_AXES.reduce((best, x) => Math.abs(x - value) < Math.abs(best - value) ? x : best);
  const sx = nearest(position.x), sz = nearest(position.z);
  const points = Math.abs(position.x - sx) < Math.abs(position.z - sz)
    ? [{ x: sx, z: position.z }, { x: sx, z: target.z }, target]
    : [{ x: position.x, z: sz }, { x: target.x, z: sz }, target];
  return points.filter(p => Math.hypot(p.x - position.x, p.z - position.z) > 32);
}
