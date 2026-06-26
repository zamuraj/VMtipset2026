## 2024-06-26 - Keyboard Focus states on UI buttons
**Learning:** Some custom UI buttons utilizing Tailwind utilities effectively missed visible focus rings. E.g., The "Tippningsmatris" component acts as a button but wasn't clearly indicated on focus using keyboard navigation.
**Action:** When creating custom buttons using non-standard components (e.g., div mimicking a button or heavily styled button), ensure `focus-visible:ring-2` is applied to maintain the keyboard accessibility navigation loop.
