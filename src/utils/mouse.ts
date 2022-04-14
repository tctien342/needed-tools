/**
 * Mouse position tracking class
 */
class MousePosition {
  x: number;
  y: number;

  constructor() {
    this.set(0, 0);
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', (ev) => this.onMouseMove(ev), true);
      window.addEventListener('mouseenter', (ev) => this.onMouseMove(ev), true);
    }
  }
  get() {
    return { x: this.x, y: this.y };
  }
  set(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  onMouseMove(e: MouseEvent) {
    this.set(e.clientX, e.clientY);
  }
}

/**
 * Current MousePosition instance
 */
const MousePos = new MousePosition();

const getMousePosition = (): { x: number; y: number } => {
  return MousePos.get();
};

export { getMousePosition, MousePos };
