# TCRAS Figma UI Design Specs

## 1. Dashboard Home (Dark Mode)
**Theme**: Cyberpunk / Security Operations Center (SOC)
**Colors**: Background `#111827`, Accents `#3B82F6` (Blue), `#EF4444` (Red)

### Layout
- **Navbar (Top, 64px height)**
  - Left: Logo "TCRAS" (Bold, White) + Icon (Shield/Graph node) (Blue glow).
  - Right: System Status Indicator (Green Pill: "ONLINE").
- **Sidebar (Left, 25% width)**
  - **Live Feed Header**: "Recent Transfers".
  - **List Items**: Card style. 
    - Icon (File Type).
    - Top Line: Filename (White).
    - Sub Line: Source IP -> Dest IP (Gray).
    - Right Side: Risk Badge (Low=Green, Med=Yellow, High=Red).
- **Main Area (Right, 75% width)**
  - **Network Graph**: Full height.
    - Black/Dark Blue gradient background.
    - Nodes: Glowing dots (Blue for devices, White for files).
    - Edges: Animated lines (Particles moving from Source to Dest).
  - **Overlay Stats (Bottom Right)**:
    - Transparent Black Box.
    - "Active Nodes: 12", "Threats: 0".

## 2. Alerts Page / Modal
**Trigger**: Appears when Risk > 70.

### UI Components
- **Container**: Centered Card or Top-Right Toast Notification.
- **Animation**: Shake effect + Red pulsing glow limit.
- **Content**:
  - **Header**: "⚠ HIGH RISK DETECTED" (Red, Large Font).
  - **Details**:
    - "File: payroll_hack.exe"
    - "Score: 98/100" (Progress bar filled red).
    - "Reason: Cyclic Transfer Loop".
- **Actions**:
  - Button: "Investigate" (Outline White).
  - Button: "Block Agent" (Solid Red).

## 3. Transfer App (Desktop)
**Theme**: Modern Dark (ttkbootstrap 'cyborg').

### Layout
- **Window**: 600x450px.
- **Header**: "Secure Transfer" (Blue).
- **Drop Zone**: Large dashed border area in center.
  - Text: "Select File to Send".
  - Icon: Upload Cloud.
- **Fields**:
  - "Destination IP": Input field (Rounded corners).
- **Footer**:
  - "Send" Button: Large, Green, glowing on hover.
  - Progress Bar: Thin stripe below button.
  - Status Text: "Ready" or "Sending [|||||] 50%".
