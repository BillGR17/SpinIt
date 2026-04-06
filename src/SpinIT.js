import { Loader } from './Loader.js';
import { Physics } from './Physics.js';
import { Renderer } from './Renderer.js';
import { EventManager } from './EventManager.js';

/**
 * SpinIT - A modular, professional JavaScript 360-degree image spinner.
 */
export class SpinIT {
  /**
   * Initializes the SpinIT instance.
   * @param {string|HTMLElement} container - The container element or CSS selector.
   * @param {Array} source - Array containing [urlTemplate, startNumber, endNumber].
   * @param {Object} [options] - Configuration options.
   */
  constructor(container, source, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;

    if (!this.container) {
      throw new Error("SpinIT Error: Container element not found.");
    }

    this.options = {
      loop: options.loop ?? true,
      inertia: options.inertia ?? true,
      friction: options.friction ?? 0.95,
      sensitivity: options.sensitivity ?? 1.0,
      velocityScale: options.velocityScale ?? 1.0,
      responsive: options.responsive ?? true,
      preload: options.preload ?? "all",
      autoplay: options.autoplay ?? true,
      autoplaySpeed: options.autoplaySpeed ?? 24,
      lazyload: options.lazyload ?? true,
      gyro: options.gyro ?? true,
      gyroSensitivity: options.gyroSensitivity ?? 2.0,
      debug: options.debug ?? false
    };

    /** @type {HTMLImageElement[]} */
    this.images = [];
    this.currentFrame = 0;
    this.virtualFrame = 0;

    this.isDragging = false;
    this.lastX = 0;
    this.lastTime = 0;
    this.velocity = 0; // Pixels per ms

    this.animationId = null;
    this.lastInertiaTime = 0;

    this.canvas = null;
    this.ctx = null;
    this.observer = null;
    this.gyroCleanup = null;
    this.isDestroyed = false;

    if (this.options.lazyload && 'IntersectionObserver' in window) {
      this.#setupLazyLoad(source);
    } else {
      this.#init(source);
    }
  }

  #setupLazyLoad(source) {
    this.#log("SpinIT: Setting up lazyload...");

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.#log("SpinIT: Container is visible, initializing...");
          this.#init(source);
          this.observer.unobserve(this.container);
          this.observer.disconnect();
          this.observer = null;
        }
      });
    }, { rootMargin: '50px' });

    this.observer.observe(this.container);
  }

  #log(...args) {
    if (this.options.debug) console.log(...args);
  }

  #error(...args) {
    if (this.options.debug) console.error(...args);
  }

  async #init(source) {
    this.#log("SpinIT: Initializing with source:", source);

    // 1. Inject styles and show loader
    Renderer.injectStyles();
    Renderer.showLoader(this.container);

    const urls = Loader.generateUrls(source[0], source[1], source[2], this.options.debug);
    const isPreloadingAll = (this.options.preload === "all" || this.options.preload >= urls.length);
    const preloadCount = isPreloadingAll ? 1 : Math.max(1, this.options.preload);

    const preloadUrls = urls.slice(0, preloadCount);

    // 2. Preload the specified number of images to show something immediately
    const preloadedImages = await Loader.preloadImages(preloadUrls, this.options.debug);

    if (this.isDestroyed) return;

    if (preloadedImages.length === 0) {
      this.#error("SpinIT Error: Could not load the initial images.");
      Renderer.hideLoader(this.container);
      return;
    }

    // Initialize this.images array with the correct length to allow correct math in physics
    this.images = new Array(urls.length);
    for (let i = 0; i < preloadedImages.length; i++) {
      this.images[i] = preloadedImages[i];
    }
    const { width, height } = preloadedImages[0];

    // 3. Initialize canvas
    const { canvas, ctx } = Renderer.initCanvas(this.container, width, height, this.options.responsive);
    this.canvas = canvas;
    this.ctx = ctx;

    if (this.options.responsive) {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.container);
    }

    // 4. Render the first frame
    this.render();

    // If preloading all, keep old behavior: blur, wait for all, unblur.
    // Otherwise, unblur immediately and load the rest in background.
    if (isPreloadingAll) {
      Renderer.applyBlur(this.canvas, true);
      this.#log("SpinIT: First frame rendered with blur. Loading remaining images...");

      Loader.preloadImages(urls, this.options.debug).then(allImages => {
        if (this.isDestroyed) return;
        this.#log(`SpinIT: Preloaded ${allImages.length} images. Clearing loading state...`);
        this.images = allImages;
        Renderer.applyBlur(this.canvas, false);
        Renderer.hideLoader(this.container);
        this.#setupEvents();
        this.render(); // Final crisp render
        this.#startAutoPlay();
        this.#log("SpinIT: Initialization complete. Canvas size:", width, "x", height);
      });
    } else {
      Renderer.applyBlur(this.canvas, false);
      Renderer.hideLoader(this.container);
      this.#setupEvents();
      this.#startAutoPlay();
      this.#log(`SpinIT: Preloaded ${preloadCount} images. Enabling interaction and loading remaining in background...`);

      const remainingUrls = urls.slice(preloadCount);
      const remainingPromises = remainingUrls.map((url, i) => {
        return Loader.preloadImages([url], this.options.debug).then(([img]) => {
          if (this.isDestroyed) return;
          const index = preloadCount + i;
          this.images[index] = img;
          if (this.currentFrame === index) {
            this.render();
          }
        });
      });

      Promise.all(remainingPromises).then(() => {
        this.#log("SpinIT: All background images loaded.");
      });
    }
  }

  #setupEvents() {
    EventManager.setupEvents(this.canvas, {
      onStart: (e) => {
        this.#log("SpinIT: Drag started at", e.clientX);
        this.isDragging = true;
        this.#stopAutoPlay();
        this.lastX = e.clientX;
        this.lastTime = performance.now();
        this.velocity = 0;

        if (this.animationId) {
          cancelAnimationFrame(this.animationId);
        }
      },
      onMove: (e) => {
        if (!this.isDragging) return;

        const now = performance.now();
        const dt = now - this.lastTime;
        const dx = e.clientX - this.lastX;

        if (dt > 0) {
          const currentVelocity = dx / dt;
          this.velocity = (this.velocity * 0.5) + (currentVelocity * 0.5);
        }

        this.updateFrame(dx);

        this.lastX = e.clientX;
        this.lastTime = now;
      },
      onEnd: () => {
        this.#log("SpinIT: Drag ended. Velocity:", this.velocity);
        this.isDragging = false;

        if (performance.now() - this.lastTime > 50) {
          this.velocity = 0;
        }

        if (this.options.inertia && Math.abs(this.velocity) > 0.1) {
          this.velocity *= this.options.velocityScale;
          this.lastInertiaTime = performance.now();
          this.#applyInertia();
        }
      }
    });

    if (this.options.gyro) {
      this.gyroCleanup = EventManager.setupDeviceOrientation({
        onOrientationChange: (dGamma) => {
          this.#log("SpinIT: Device tilted by", dGamma);
          this.#stopAutoPlay();
          
          if (this.animationId) {
            cancelAnimationFrame(this.animationId);
          }

          this.updateFrame(dGamma * this.options.gyroSensitivity);
        }
      });
    }
  }

  /**
   * Updates the current frame based on movement.
   * @param {number} dx - Movement in pixels.
   */
  updateFrame(dx) {
    const { virtualFrame, currentFrame } = Physics.calculateFrame(
      this.virtualFrame,
      dx,
      this.options.sensitivity,
      this.images.length,
      this.options.loop
    );

    this.virtualFrame = virtualFrame;

    if (this.currentFrame !== currentFrame) {
      this.#log(`SpinIT: Switching to frame ${currentFrame} (virtual: ${virtualFrame.toFixed(2)})`);
      this.currentFrame = currentFrame;
      this.render();
    }

    // Hard stop for non-looping spin
    if (!this.options.loop && (this.virtualFrame === 0 || this.virtualFrame === this.images.length - 1)) {
      this.velocity = 0;
    }
  }

  #applyInertia() {
    const now = performance.now();
    const dt = now - this.lastInertiaTime;
    this.lastInertiaTime = now;

    if (dt <= 0) {
      this.animationId = requestAnimationFrame(() => this.#applyInertia());
      return;
    }

    this.velocity = Physics.applyFriction(this.velocity, this.options.friction, dt);
    const frameMovement = this.velocity * dt;

    if (Math.abs(frameMovement) < 0.1) {
      this.velocity = 0;
      this.lastInertiaTime = 0;
      return;
    }

    this.updateFrame(frameMovement);
    this.animationId = requestAnimationFrame(() => this.#applyInertia());
  }

  /**
   * Handles container resize.
   */
  handleResize() {
    if (!this.canvas || !this.container) return;
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.render();
  }

  /**
   * Renders the current frame.
   */
  render() {
    Renderer.renderFrame(
      this.ctx,
      this.images[this.currentFrame],
      this.canvas.width,
      this.canvas.height,
      this.options.debug,
      this.currentFrame
    );
  }

  /**
   * Destroys the SpinIT instance and cleans up.
   */
  destroy() {
    this.isDestroyed = true;
    this.#stopAutoPlay();
    if (this.observer) {
      this.observer.unobserve(this.container);
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.gyroCleanup) {
      window.removeEventListener('deviceorientation', this.gyroCleanup);
      this.gyroCleanup = null;
    }
    // Remove canvas if needed, or other cleanup...
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }

  #startAutoPlay() {
    if (this.options.autoplay === false) return;

    this.isAutoPlaying = true;

    let targetFrame = null;
    if (typeof this.options.autoplay === 'number') {
      targetFrame = this.options.autoplay;
      if (this.currentFrame === targetFrame) return;
    }

    this.autoPlayInterval = setInterval(() => {
      if (!this.isAutoPlaying) {
        this.#stopAutoPlay();
        return;
      }

      this.updateFrame(-this.options.sensitivity);

      if (targetFrame !== null && this.currentFrame === targetFrame) {
        this.#stopAutoPlay();
      } else if (!this.options.loop && this.currentFrame === this.images.length - 1) {
        this.#stopAutoPlay();
      }
    }, 1000 / this.options.autoplaySpeed);
  }

  #stopAutoPlay() {
    this.isAutoPlaying = false;
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }
}
