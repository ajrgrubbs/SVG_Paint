# SVG_Paint
Proof-of-concept project of a multi-touch illustration API driven purely by JavaScript-generated SVGs.

Caveats:
Only touch interfaces are supported for this.
Tested on Chrome for Moto X, Nexus 9, and Ubuntu. No guarantees for any other devices or OSes.
Chrome may require you to explicitly enable touch events on the "chrome://flags" configuration page.

Directions:
Alter options by clicking the pencil icon on the top right of the screen.
Line behavior: Pretty simple, just draws a single line.
Path behavior: Try dragging with one finger, then without lifting it start dragging with another finger.

Color/Fill: Controls the line color or path fill color. All valid CSS options are supported. For example: "none", "black", "lightblue", "rgba(255, 0, 255, .5)".
