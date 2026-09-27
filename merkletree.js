// merkletree.js：父节点与证明校验
export function parentOf(left, right) {
  return (left * 31 + right) % 1000;
}

export function verifyPath(leaf, index, path) {
  let value = leaf;
  let spot = index;
  path.forEach(function (sibling) {
    if (spot % 2 === 0) value = parentOf(value, sibling);
    else value = parentOf(sibling, value);
    spot = Math.floor(spot / 2);
  });
  return value;
}
