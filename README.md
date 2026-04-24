# Blood Strike Creator Hub

Welcome to the **Blood Strike Creator Hub** (v1.0) – a fully responsive, professional web application designed for gaming content creators. This platform serves as a centralized hub to showcase your latest videos, announce game updates, manage tournaments, and host interactive giveaways.

## 🚀 Features

- **Responsive Multi-Page Architecture**: Fast and seamless navigation across five dedicated pages (`Home`, `Updates`, `Social`, `Tournaments`, and `Spin Wheel`).
- **Modern Sidebar UI**: A sleek, persistent sidebar on desktop that transforms into a smooth sliding hamburger menu on mobile devices.
- **Glassmorphism Aesthetic**: Beautiful, semi-transparent frosted glass components overlaying a dynamic, interactive 3D particle background.
- **Interactive 3D Spin Wheel**: Built using Three.js, this feature allows you to randomly select winners from live YouTube video comments during giveaways.
- **Admin Dashboard & CMS**: A secure, PIN-protected (`/admin.html`) backend that allows you to:
  - Connect your YouTube channel API.
  - Update your featured, popular, and latest videos.
  - Generate exciting patch notes using Gemini AI.
  - Manage live tournament brackets and links.
  - Trigger live giveaways on the public spin wheel.

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, and JavaScript
- **3D Rendering**: Three.js (for the interactive giveaway wheel)
- **Styling**: Custom CSS properties, CSS Grid/Flexbox, and FontAwesome icons
- **Backend/Hosting Support**: 
  - Render (via `render.yaml`)
  - Firebase Hosting (via `firebase.json`)
  - Local Node.js server (`server.js`) and PowerShell server (`server.ps1`) for local development

## 📱 Mobile Responsiveness

The Creator Hub is fully optimized for all devices. On screens smaller than `900px`, the desktop sidebar intelligently hides itself and introduces a sticky mobile header with a slide-out navigation drawer. The layout fluidly adjusts grid columns to ensure video thumbnails and tournament cards remain perfectly sized on phones and tablets.

## ⚙️ Configuration & Data

All platform data—including your connected social links, latest videos, upcoming events, and AI-generated patch notes—is securely managed via the Admin Dashboard and saved. **Your existing data (social links, videos, and events) is preserved and dynamically injected into the UI.**

## 🌐 Deployment

This project is configured for continuous deployment on **Render**. Simply push your changes to the `main` branch of this GitHub repository, and Render will automatically build and deploy the latest version of the Creator Hub to the live web.

---
*Created with ❤️ for the Blood Strike gaming community.*
