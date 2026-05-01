# ZeroPOS

[![Download Latest Release](https://img.shields.io/github/v/release/malshan444/ZeroPOS?color=brightgreen&label=Download%20Latest%20.exe&style=for-the-badge)](https://github.com/malshan444/ZeroPOS/releases/latest)

A sleek, modern, and entirely offline Point of Sale (POS) application built for speed and reliability. ZeroPOS is designed to run seamlessly on Windows machines as a native application without requiring an internet connection.

## ✨ Features

- **Completely Offline**: All data is securely stored locally on the machine.
- **Modern UI/UX**: A highly polished, frameless dark-mode interface designed for high-contrast environments.
- **Dynamic Cart Management**: Instantly add items, apply percentage or fixed discounts, and calculate service charges.
- **Built-in Receipt Printing**: Optimized thermal printing styles for clean, legible paper receipts.
- **Detailed Reporting**: View and export comprehensive sales reports directly to CSV.

## 🚀 Installation (.exe)

You can easily build a standalone Windows Installer (`.exe`) to deploy ZeroPOS to any restaurant or retail terminal.

1. Clone the repository:
   ```bash
   git clone https://github.com/malshan444/ZeroPOS.git
   cd ZeroPOS
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Build the executables:
   - Run `npm run build` to compile the standard 64-bit Windows installer.
   - Run `npm run build:arm` to compile for ARM-based Windows devices.
   - Run `npm run build:all` to compile a universal installer.
4. Locate the output installer: The final, packaged `.exe` will be generated inside the `dist/` directory.

Alternatively, for active development, you can simply run `npm start` to boot up the application in developer mode.

## 🛠️ Technologies Used

ZeroPOS was engineered from the ground up using a lightweight, high-performance tech stack:

- **[Electron](https://www.electronjs.org/)**: Powers the core desktop application framework, providing native OS integration and frameless window support.
- **[SQLite (sql.js)](https://sql.js.org/)**: An embedded, file-based relational database that powers the offline-first architecture, storing all items, settings, and sales history locally.
- **Vanilla Web Stack**: Built purely with **HTML5, CSS3, and JavaScript** without heavy frontend frameworks to ensure instant load times and snappy interactions on low-spec hardware.
- **[Lucide Icons](https://lucide.dev/)**: Clean, consistent, open-source iconography.
- **[electron-builder](https://www.electron.build/)**: Utilized for packaging the raw source code into distributable, production-ready NSIS Windows installers.
