# Perspective Warp Tool

A simple 3D perspective warp tool built with HTML5 Canvas and JavaScript. This tool allows you to transform images by dragging the four corner points to create perspective effects.

## Features

- Load any image from your device
- Drag corner handles to distort and transform the image
- Real-time transformation with 3D perspective
- Optional grid overlay to visualize the transformation
- Reset button to return to original state
- Pure JavaScript implementation (no external libraries)
- Responsive design that works on all modern browsers
- Touch support for mobile devices

This tool implements:
- Projective transformation using a 3x3 homography matrix
- Inverse mapping with bilinear interpolation for smooth rendering
- Matrix computation via Gaussian elimination