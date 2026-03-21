/**
 * Physics module for SpinIT.
 * Handles frame calculations, inertia, and friction.
 */
export class Physics {
  /**
   * Calculates the current frame based on movement.
   * @param {number} virtualFrame - Current virtual frame.
   * @param {number} movementX - Movement in pixels.
   * @param {number} sensitivity - Pixels per frame.
   * @param {number} totalFrames - Total number of frames.
   * @param {boolean} loop - Whether to loop the animation.
   * @returns {Object} - Updated virtualFrame and final currentFrame.
   */
  static calculateFrame(virtualFrame, movementX, sensitivity, totalFrames, loop) {
    const frameChange = -(movementX / sensitivity);
    let nextVirtualFrame = virtualFrame + frameChange;

    if (loop) {
      nextVirtualFrame = ((nextVirtualFrame % totalFrames) + totalFrames) % totalFrames;
    } else {
      nextVirtualFrame = Math.max(0, Math.min(totalFrames - 1, nextVirtualFrame));
    }

    return {
      virtualFrame: nextVirtualFrame,
      currentFrame: Math.floor(nextVirtualFrame)
    };
  }

  /**
   * Applies friction to velocity over time.
   * @param {number} velocity - Current velocity pixels/ms.
   * @param {number} friction - Friction coefficient.
   * @param {number} dt - Time delta in ms.
   * @returns {number} - New velocity.
   */
  static applyFriction(velocity, friction, dt) {
    // Normalize friction to 16ms/frame
    const effectiveFriction = Math.pow(friction, dt / 16);
    return velocity * effectiveFriction;
  }
}
