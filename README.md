# Irame

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
  - [Other Available Scripts](#other-available-scripts)

---

## Overview

**Irame** is a web application that helps users **analyze, audit, and visualize data using AI-powered insights**.  

The platform aims to make auditing more efficient, transparent, and user-friendly.

---

## Features

- **AI-Powered Auditing** – Analyze datasets and detect anomalies or patterns with AI assistance.
- **Interactive Dashboards** – Rich charts and visualizations powered by `chart.js` and `d3`.
- **Advanced UI Components** – Built using `Radix UI`, and `Tailwind CSS`.
- **Data Import/Export** – Supports PDF, CSV, XLSX formats.
- **Form Management** – Seamless form handling with validation using `react-hook-form`.
- **Responsive & Accessible** – Optimized for all devices with accessibility best practices.

---

## Tech Stack

**Frontend Framework**
- [React](https://react.dev/) (v18)
- [Vite](https://vitejs.dev/)

**Styling & UI**
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)

**State & Data Management**
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Query](https://tanstack.com/query/latest)

**Visualization**
- [Chart.js](https://www.chartjs.org/)
- [D3.js](https://d3js.org/)

**Utilities**
- [Axios](https://axios-http.com/) for API calls
- [dayjs](https://day.js.org/) for date/time handling
- [PapaParse](https://www.papaparse.com/) for CSV parsing

---

## Getting Started

### Prerequisites
Make sure you have installed:
- **Node.js** (v18+ recommended)
- **npm**

Check your versions:
```bash
node -v
npm -v
```

---

### Installation
```bash
git clone https://github.com/irame-tech/irame-mvp.git
cd irame-mvp
npm install
```

---

### Environment Variables
Copy the `.env.example` file to `.env` and fill in the required values:

```bash
cp .env.example .env
```

---

### Running the App
```bash
npm run dev
```
The app will be available at:
```
http://localhost:5173
```

---

### Other Available Scripts
```bash
npm run build   # Builds the app for production
npm run preview # Previews the production build locally
npm run lint    # Runs ESLint checks
npm run format  # Formats code using Prettier
```