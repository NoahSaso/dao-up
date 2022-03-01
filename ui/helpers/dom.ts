export const getScrollableParent = (
  node: HTMLElement | null
): HTMLElement | Window =>
  node === null
    ? window
    : node.scrollHeight > node.clientHeight
    ? node
    : getScrollableParent(node.parentElement)
