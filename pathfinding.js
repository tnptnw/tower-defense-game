const DIRS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 }
];

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function isWalkableForPath(grid, x, y, start, goal) {
  if (x === start.x && y === start.y) {
    return true;
  }
  if (x === goal.x && y === goal.y) {
    return true;
  }
  return grid.isWalkable(x, y);
}

export function findPath(grid, start, goal) {
  const open = [];
  const openMap = new Map();
  const closed = new Set();
  const visited = [];

  const startKey = grid.key(start.x, start.y);
  const startNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: manhattan(start, goal),
    f: 0,
    parent: null
  };
  startNode.f = startNode.g + startNode.h;
  open.push(startNode);
  openMap.set(startKey, startNode);

  while (open.length > 0) {
    // A* priority: expand the lowest f = g + h
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    openMap.delete(grid.key(current.x, current.y));

    visited.push({ x: current.x, y: current.y });

    if (current.x === goal.x && current.y === goal.y) {
      const path = [];
      let node = current;
      while (node) {
        path.push({ x: node.x, y: node.y });
        node = node.parent;
      }
      path.reverse();
      return { path, visited };
    }

    closed.add(grid.key(current.x, current.y));

    for (const dir of DIRS) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const key = grid.key(nx, ny);

      if (!grid.isInside(nx, ny)) {
        continue;
      }
      if (!isWalkableForPath(grid, nx, ny, start, goal)) {
        continue;
      }
      if (closed.has(key)) {
        continue;
      }

      const gScore = current.g + 1;
      const existing = openMap.get(key);

      // A* relaxation: if the new g is better, update parent and f
      if (!existing || gScore < existing.g) {
        const hScore = manhattan({ x: nx, y: ny }, goal);
        const node = {
          x: nx,
          y: ny,
          g: gScore,
          h: hScore,
          f: gScore + hScore,
          parent: current
        };
        openMap.set(key, node);
        if (!existing) {
          open.push(node);
        } else {
          const index = open.indexOf(existing);
          if (index !== -1) {
            open[index] = node;
          }
        }
      }
    }
  }

  return { path: null, visited };
}
