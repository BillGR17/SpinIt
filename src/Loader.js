/**
 * Loader module for SpinIT.
 * Handles image URL generation and preloading images.
 */
export class Loader {
  /**
   * Generates an array of image URLs from a template.
   * @param {string} template - The URL template (e.g., "img_##.jpg").
   * @param {number} start - Start index.
   * @param {number} end - End index.
   * @param {boolean} [debug=false] - Whether to log warnings/errors.
   * @returns {string[]}
   */
  static generateUrls(template, start, end, debug = false) {
    const urls = [];
    const match = template.match(/(#+)/);

    if (!match) {
      if (debug) console.error("SpinIT Loader Error: No '#' pattern found in the URL template.");
      return urls;
    }

    const placeholder = match[0];
    const paddingLength = placeholder.length;

    for (let i = start; i <= end; i++) {
      const numberStr = String(i).padStart(paddingLength, "0");
      urls.push(template.replace(placeholder, numberStr));
    }

    return urls;
  }

  /**
   * Preloads a list of images.
   * @param {string[]} urls - The URLs to preload.
   * @param {boolean} [debug=false] - Whether to log warnings/errors.
   * @returns {Promise<HTMLImageElement[]>}
   */
  static preloadImages(urls, debug = false) {
    const promises = urls.map(url => {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          if (debug) console.warn(`SpinIT Loader Warning: Failed to load image at ${url}`);
          resolve(null);
        };
        img.src = url;
      });
    });

    return Promise.all(promises).then(images => images.filter(img => img !== null));
  }
}
