/**
 * EventManager module for SpinIT.
 * Handles user interactions via pointer events.
 */
export class EventManager {
  /**
   * Sets up pointer events for an element.
   * @param {HTMLElement} element - The target element.
   * @param {Object} callbacks - Object containing callback functions.
   * @param {Function} callbacks.onStart - Called on pointer down.
   * @param {Function} callbacks.onMove - Called on pointer move.
   * @param {Function} callbacks.onEnd - Called on pointer up/cancel.
   */
  static setupEvents(element, { onStart, onMove, onEnd }) {
    element.style.touchAction = "none";

    element.addEventListener("pointerdown", (e) => {
      onStart(e);
      element.setPointerCapture(e.pointerId);
    });

    element.addEventListener("pointermove", (e) => {
      onMove(e);
    });

    const stopDrag = (e) => {
      onEnd(e);
      try {
        if (element.hasPointerCapture(e.pointerId)) {
          element.releasePointerCapture(e.pointerId);
        }
      } catch (error) {
        // Suppress browser quirks where hasPointerCapture is true but pointer is already invalidated
      }
    };

    element.addEventListener("pointerup", stopDrag);
    element.addEventListener("pointercancel", stopDrag);
  }
}
