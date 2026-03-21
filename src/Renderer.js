/**
 * Renderer module for SpinIT.
 * Handles canvas initialization and drawing.
 */
export class Renderer {
  /**
   * Initializes a canvas within a container.
   * @param {HTMLElement} container - The container element.
   * @param {number} width - Default width if not responsive.
   * @param {number} height - Default height if not responsive.
   * @param {boolean} [responsive=true] - Whether the canvas should be responsive.
   * @returns {Object} - { canvas, ctx }
   */
  static initCanvas(container, width, height, responsive = true) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (responsive) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    } else {
      canvas.width = width;
      canvas.height = height;
    }

    canvas.className = "spinit-canvas";
    container.style.position = "relative"; // Ensure loader stays within container
    container.appendChild(canvas);
    return { canvas, ctx };
  }

  /**
   * Injects the required CSS for the loader and blur effect.
   */
  static injectStyles() {
    const styleId = "spinit-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .spinit-canvas.blurry {
        filter: blur(15px);
        transition: filter 0.6s ease;
      }
      .spinit-loader {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spinit-spin 1s linear infinite;
        z-index: 10;
        pointer-events: none;
      }
      @keyframes spinit-spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Toggles blur effect on the canvas.
   * @param {HTMLCanvasElement} canvas 
   * @param {boolean} isBlurry 
   */
  static applyBlur(canvas, isBlurry) {
    if (!canvas) return;
    if (isBlurry) {
      canvas.classList.add("blurry");
    } else {
      canvas.classList.remove("blurry");
    }
  }

  /**
   * Shows a loading indicator in the container.
   * @param {HTMLElement} container 
   */
  static showLoader(container) {
    if (!container) return;
    if (container.querySelector(".spinit-loader")) return;
    const loader = document.createElement("div");
    loader.className = "spinit-loader";
    container.appendChild(loader);
  }

  /**
   * Hides the loading indicator.
   * @param {HTMLElement} container 
   */
  static hideLoader(container) {
    if (!container) return;
    const loader = container.querySelector(".spinit-loader");
    if (loader) {
      loader.remove();
    }
  }

  /**
   * Renders a specific frame to the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas context.
   * @param {number} width - Canvas width.
   * @param {number} height - Canvas height.
   * @param {boolean} [debug=false] - Whether debug mode is enabled.
   * @param {number} [frameIndex=0] - The current frame index.
   */
  static renderFrame(ctx, image, width, height, debug = false, frameIndex = 0) {
    if (!ctx || !image) return;
    ctx.clearRect(0, 0, width, height);
    
    // Calculate scale to fit image (equivalent to object-fit: contain)
    const scale = Math.min(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    
    // Center the image
    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;
    
    ctx.drawImage(image, x, y, drawWidth, drawHeight);

    if (debug) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, 10, 140, 36);
      ctx.fillStyle = "white";
      ctx.font = "16px monospace";
      ctx.fillText(`Frame: ${frameIndex}`, 20, 34);
    }
  }
}
