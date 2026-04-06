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

  /**
   * Sets up device orientation (gyroscope) events for mobile interaction.
   * @param {Object} callbacks - Object containing callback functions.
   * @param {Function} callbacks.onOrientationChange - Called on orientation change with delta gamma.
   * @returns {Function} The event listener function to be used for cleanup.
   */
  static setupDeviceOrientation({ onOrientationChange }) {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) return null;

    let lastGamma = null;

    const handleOrientation = (e) => {
      let gamma = e.gamma; // [-90, 90]
      if (gamma === null) return;

      if (lastGamma !== null) {
        let dGamma = gamma - lastGamma;

        // Handle possible wrap-around issues around 90 / -90
        if (dGamma > 90) dGamma -= 180;
        else if (dGamma < -90) dGamma += 180;

        if (Math.abs(dGamma) > 0.05) {
          onOrientationChange(dGamma);
        }
      }
      lastGamma = gamma;
    };

    window.addEventListener('deviceorientation', handleOrientation);

    // Return handler for cleanup
    return handleOrientation;
  }
}
