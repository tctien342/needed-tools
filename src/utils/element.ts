/**
 * Get element position on parent
 */
const getWindowRelativeOffset = (
  parentWindow: Element,
  elem: Element,
): { bottom: number; left: number; right: number; top: number } => {
  const offset = {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
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
