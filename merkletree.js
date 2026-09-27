// merkletree.js：父节点与证明校验
export function parentOf(left, right) {
  return (left * 31 + right) % 1000;
}

export function verifyPath(leaf, index, path) {
  let value = leaf;
  let cursor = index;
  for (let level = 0; level < path.length; level += 1) {
    const sibling = path[level];
    value = cursor % 2 === 0 ? parentOf(value, sibling) : parentOf(sibling, value);
    cursor = Math.floor(cursor / 2);
  }
  return value;
}
