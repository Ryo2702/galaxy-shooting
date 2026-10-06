export const input = {
  keys: new Set(),
  pointerX: 0,
  pointerY: 0,
  pointerActive: false,
  shoot: false,
};
export function resetInput() {
  input.keys.clear();
  input.shoot = false;
  input.pointerActive = false;
}
