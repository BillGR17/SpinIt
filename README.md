# SpinIt.js

A lightweight, high-performance JavaScript library for 360-degree image rotation. Perfect for product displays and interactive image viewers.

[**Explore the Live Demo Showcase**](https://static.billgr17.click/spinit/)



## Features

- **No Dependencies**: No external libraries required.
- **Lightweight**: Minimal overhead and fast loading.
- **Responsive**: Adapts to various screen sizes.
- **Interactive**: Support for mouse and touch interactions.
- **Configurable**: Easy to customize sensitivity, responsiveness, and more.
- **Preload**: Number of initial images to load before making the viewer interactive. Other images fetch in the background.


## Installation

### Via npm

```bash
npm install spinit-js
```


## Quick Start

1. **Prepare your container**:

```html
<div id="spinit-container" style="width: 100%; height: 500px;"></div>
```

2. **Initialize SpinIt**:

```javascript
import { SpinIT } from "spinit-js";

// container, [urlTemplate, startFrame, endFrame], options
const spinit = new SpinIT("#spinit-container", ["img_##.jpg", 1, 90], {
    loop: true,
    inertia: true,
    friction: 0.95,
    sensitivity: 1.0,
    velocityScale: 1.0,
    responsive: true,
    preload: "all",
    autoplay: true,
    autoplaySpeed: 24
});
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `loop` | `Boolean` | `true` | Whether the animation should loop when reaching the first or last frame. |
| `inertia` | `Boolean` | `true` | Enables smooth deceleration after the user stops dragging. |
| `friction` | `Number` | `0.95` | Controls how quickly the inertia slows down. (0 to 1) |
| `sensitivity` | `Number` | `1.0` | Adjusts rotation speed. Lower values increase sensitivity (faster rotation). |
| `velocityScale` | `Number` | `1.0` | Multiplier for the initial inertia velocity. |
| `responsive` | `Boolean` | `true` | Automatically resizes the canvas to match its container. |
| `preload` | `Number` \| `"all"` | `"all"` | Number of initial images to load before making the viewer interactive. Other images fetch in the background. |
| `autoplay` | `Boolean` \| `Number` | `true` | If true, spins automatically until user interaction. If a number, auto-spins until that frame index. |
| `autoplaySpeed` | `Number` | `24` | Autoplay speed in Frames Per Second (FPS). |
| `debug` | `Boolean` | `false` | Enables debug mode. |
| `lazyload` | `Boolean` | `true` | Enables lazy load the SpinIT container. |
| `gyro` | `Boolean` | `true` | Enables device gyroscope (orientation) controls to spin the image by leaning device left/right on mobile devices. |
| `gyroSensitivity` | `Number` | `2.0` | Sensitivity for gyroscope controls. Higher values result in faster spinning when tilting the device. |


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
