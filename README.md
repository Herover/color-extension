# color-extension

For information about building the project, see the color-popup folder.

## Description

### General

A browser extension for editing color schemes directly on websites. The extension allows for quick experimentation and comparison of different designs. It is intended to support the design process of websites and facilitates direct cooperation between developers and designers. 

### Capabilities

1. Identify color definitions in stylesheets on websites (#RRGGBB, rgb(...), hsl(...), hwb(...) )
2. Manipulation of CSS-colors or groups of colors on websites
3. Export changes as CSS
4. Parallel prototyping with systematic color alterations across several instances of a palette (swatch?)

## Installation

To download a pre-compiled extension that can be loaded into Google Chrome in developer mode, see the [release page on GitHub](https://github.com/Herover/color-extension/releases), download the chrome.zip file, extract its content into a folder, and point Chrome to it.

1. Download the folder from release page on GitHub
2. Activate Chrome’s developer mode
3. In Chrome, go to “manage extensions”, click “load unpacked”, find the downloaded folder and select it

## How to use the extension

1. Open a website in Chrome
2. Find the extension within Chrome’s extension-menu and open it

![Screenshot from 2023-01-19 14-05-41](https://user-images.githubusercontent.com/793943/213541161-8ac86f05-c904-449c-9a59-8017f1ae561d.png)

Top buttons:

* Get rules:
   * Finds all color definitions in stylesheets on the website in the format #RRGGBB, rgb(...), hsl(...), and hwb(...), including variants with a alpha channel (color names are not recognized)
   * Visualizes the colors in an interactive color wheel
* Get variables only:
   * Finds the colors on the website that are defined as CSS-variables
   * Visualizes the found colors in an interactive color wheel
* Clear store:
   * resets the extension to the initial state

Color circle:

* The colors found on the website are shown as circles on the color wheel
* The saturation and hue of individual colors can be changed by clicking and dragging their respective circle on the wheel
* By holding control multiple colors can be selected at once
* Dragging one of the selected colors across the color wheel affects all selected colors
* The slider under the color wheel changes the value of the selected color(s)

Selection:

* Switching the select mode to “ΔE” allows defining a perceptual distance. Clicking on individual colors on the color wheel now selects all colors within the defined perceptual distance from it allowing to change them at once. 
* Activating “Name” allows the selection of color groups as defined by Heer and Stone (2012)
* Deselect all:
  * Deselects all colors on the color wheel

Palettes:

After clicking "Get rules", there will be a root palette.

* +copy creates a copy of the currently selected palette, selectes it, and allow changing it independently

* +depend does the same as +copy, but changes done to the previously selected palette will also be applied to the new copy

* Clicking on a button with a palettes name on it will make the current tab use this palette

It's possible to open multiple tabs in different windows of the same page, and make them use different palettes. Changes done in one browser tab will be reflected in other tabs that use the same palette.

## Usage withing JavaScript applications

If your page uses JavaScript to choose colors and you want to use this extension, then the webpage needs to be able to tell the extension about itself and react to changes. This can be done by adding something like this code snippet:

```JavaScript
// Define the colors that the extensino needs to know about
let colors = [
  { key: "a", color: "#ff0000" },
  { key: "b", color: "#00ff00" },
  { key: "c", color: "#0000ff" },
];

// Tell the extension about them
window.onload = () => window.postMessage(
  {
    COLOR_EXT: {
      action: "register",
      name: "test",
      type: "ordinal",
      colors,
    },
  },
  window.origin,
);

// Listen for messages
window.addEventListener("message", e => {
  if (
    // Messages from extension content script has same origin as window,
    // check to avoid messages from less trusted sources
    e.origin == window.origin
    && e.data.COLOR_EXT
    && e.data.COLOR_EXT.action === "setColors"
  ) {
    colors = e.data.COLOR_EXT.colors;
    
    // Call the function that does something with the colors
    render();
  }
});
  ```
