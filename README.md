# RoadScan

A cross-platform mobile application that tracks road roughness using smartphone sensors (accelerometer, gyroscope) and GPS to help identify and map road quality.

## Overview

RoadScan empowers users to measure and visualize road conditions in real-time. The app collects sensor data while driving, calculates roughness metrics, and displays color-coded maps showing road quality. Historical data analysis helps users and transportation departments identify problem areas.

## Features

### Core Functionality
- 📡 **Real-time Scanning** - Collect road roughness data using device sensors
- 🗺️ **Map Visualization** - Color-coded paths showing road quality
- 📊 **Analytics** - Statistics and graphs of your driving data
- 📜 **History** - Review and overlay past scan sessions
- 🔗 **Resources** - Links to DOT and FHA websites
- 👤 **User Profiles** - Track vehicle and phone information

### Planned Features
- Background tracking
- Community heatmaps
- Road quality notifications
- Data export capabilities
- Admin dashboard

## Project Structure

```
roadscan/
├── mobile/              # React Native/Expo mobile app
├── backend/             # Supabase functions and migrations
├── admin-dashboard/     # Admin web interface (planned)
└── docs/                # Documentation and development plans
```

## Quick Start

### Mobile App

1. Install dependencies:
```bash
npm install --prefix mobile
```

2. Set up environment variables:
```bash
cp mobile/.env.example mobile/.env
# Edit mobile/.env with your Supabase credentials
```

3. Start the development server:
```bash
npm start --prefix mobile
```

See [mobile/README.md](mobile/README.md) for detailed setup instructions.

## Tech Stack

- **Mobile:** React Native + Expo + TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Maps:** React Native Maps / MapLibre
- **Charts:** React Native Chart Kit
- **State:** React Hooks + AsyncStorage

## Development Status

🚧 **Early Development** - Phase 1 Complete

- ✅ Project initialization
- ✅ Basic navigation and screens
- ✅ Configuration setup
- 🚧 Sensor data collection (next)
- 🚧 Map visualization (next)

See [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) for the complete 15-week roadmap.

## Contributing

This is currently a private development project. Contribution guidelines will be added once the project reaches beta status.

## License

TBD

## Contact

For questions or feedback, please open an issue on this repository.
