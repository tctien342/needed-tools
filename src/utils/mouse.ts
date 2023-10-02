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
  private onMouseMove(e: MouseEvent) {
    this.set(e.clientX, e.clientY);
  }
  get() {
    return { x: this.x, y: this.y };
  }
  onMove(callback: (x: number, y: number) => void) {
    callback(this.x, this.y);
  }
  set(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

/**
 * Current MousePosition instance
 */
const MousePos = new MousePosition();

const getMousePosition = (): { x: number; y: number } => {
  return MousePos.get();
};

export { MousePos, getMousePosition };
