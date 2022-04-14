/**
 * Get element position on parent
 */
const getWindowRelativeOffset = (
  parentWindow: Element,
  elem: Element,
): { left: number; top: number; right: number; bottom: number } => {
  const offset = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  };
  // relative to the target field's document
  const childPos = elem.getBoundingClientRect();
  const parentPos = parentWindow.getBoundingClientRect();

  offset.top = childPos.top - parentPos.top;
  offset.right = childPos.right - parentPos.right;
  offset.bottom = childPos.bottom - parentPos.bottom;
  offset.left = childPos.left - parentPos.left;

  return offset;
};

export { getWindowRelativeOffset };
