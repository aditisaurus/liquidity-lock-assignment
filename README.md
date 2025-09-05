# liquidity-lock-assignment

# Interactive Graph Dashboard

An interactive data visualization dashboard built with **React + D3.js**, featuring a dynamic graph and editable data points table. 

This project allows you to **add, edit, delete, move, highlight, zoom, pan, undo/redo, and export data points** seamlessly in a modern UI.

## 🌐 Live Demo

**[View Live Demo](https://liquidity-lock-assignment.web.app/)**

Try the interactive dashboard directly in your browser - no installation required!

---

## 🚀 Features

- 📊 **Interactive Graph**
  - Double-click on the graph to add new points.
  - Drag points to move them (live updates reflected in the table).
  - Hover or select rows in the table to highlight points on the graph.
  - Scroll to zoom in/out, drag to pan across the graph.

- 📋 **Data Points Table**
  - Displays all points with their `id`, `x`, and `y` coordinates.
  - Hover a row → highlights the corresponding graph point.
  - Click edit → update coordinates directly.
  - Delete points instantly.
  - Auto-scroll to highlighted point if out of view.

- 🔄 **Undo / Redo**
  - Go back and forth between previous graph states.

- 📤 **Export**
  - Export all points as **JSON** or **CSV**.

- 💾 **Persistence**
  - Data is stored in `localStorage`, so refreshing the page won't lose your points.

- ⚡ **Modern UI**
  - Built with **TailwindCSS** and **Material-UI**.
  - Responsive layout with a clean dashboard design.

---

## 🛠️ Tech Stack

- **React** – UI library
- **D3.js** – Interactive graph rendering
- **TailwindCSS** – Styling
- **Material-UI (MUI)** – Components (Table, Typography, etc.)
- **LocalStorage** – Data persistence
- **Vite** – Development bundler (fast hot-reloading)

---

## 🖥️ Installation & Setup Guide

### Option 1: Try the Live Demo 🚀
Simply visit **[https://liquidity-lock-assignment.web.app/](https://liquidity-lock-assignment.web.app/)** - no installation required!

### Option 2: Run Locally 💻

#### 1️⃣ Prerequisites

Install Node.js (>= 18) and npm (>= 9).

Verify in your terminal:
```bash
node -v
npm -v
```

#### 2️⃣ Clone Repository

Open a terminal (Command Prompt, PowerShell, or your IDE's built-in terminal) and run:
```bash
git clone https://github.com/aditisaurus/liquidity-lock-assignment.git
```

Then move into the project folder:
```bash
cd liquidity-lock-assignment
```

#### 3️⃣ Install Dependencies

Inside the project folder, run:
```bash
npm install
```

This installs React, D3, TailwindCSS, MUI, Firebase, and other dependencies listed in `package.json`.

#### 4️⃣ Start Development Server

Still in the project folder, start the app with:
```bash
npm run dev
```

This will show output like:
```
VITE v5.x.x  ready in 500ms
➜  Local:   http://localhost:5173/
```

👉 Open a browser and go to `http://localhost:5173/`.