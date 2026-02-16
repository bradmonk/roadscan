# RoadScan Mobile App

React Native mobile application for tracking road roughness using device sensors.

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (Mac only)
- Android: Android Studio

### Installation

1. Install dependencies:
```bash
npm install --prefix mobile
```

2. Create environment file:
```bash
cp mobile/.env.example mobile/.env
```

3. Update `mobile/.env` with your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Running the App

```bash
# Start Expo development server
npm start --prefix mobile

# Run on iOS simulator (Mac only)
npm run ios --prefix mobile

# Run on Android emulator
npm run android --prefix mobile

# Run in web browser (for testing)
npm run web --prefix mobile
```

## Project Structure

```
mobile/
├── src/
│   ├── screens/         # Screen components
│   │   ├── Home/        # Landing page with 6 tiles
│   │   ├── Scan/        # Road scanning feature
│   │   ├── History/     # Scan history
│   │   ├── Graphs/      # Statistics and charts
│   │   ├── Resources/   # External links
│   │   ├── Help/        # Help and FAQ
│   │   └── Account/     # User profile
│   ├── components/      # Reusable components
│   ├── navigation/      # Navigation configuration
│   ├── services/        # API, sensors, location services
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript types
│   ├── store/           # State management
│   └── constants/       # App constants
├── assets/              # Images, fonts
└── App.tsx              # Entry point
```

## Features (Planned)

- ✅ 6-tile landing page
- ✅ Basic navigation
- 🚧 Real-time road scanning with sensors
- 🚧 GPS tracking and mapping
- 🚧 Historical scan visualization
- 🚧 Statistical analysis and graphs
- 🚧 User authentication
- 🚧 Cloud data sync

## Tech Stack

- **Framework:** React Native with Expo
- **Language:** TypeScript
- **Navigation:** React Navigation
- **Backend:** Supabase (PostgreSQL)
- **Maps:** React Native Maps
- **Charts:** React Native Chart Kit
- **Sensors:** Expo Sensors (Accelerometer, Gyroscope)
- **Location:** Expo Location

## Development Status

Currently in Phase 1: Basic setup and navigation complete.

See [docs/DEVELOPMENT_PLAN.md](../docs/DEVELOPMENT_PLAN.md) for full roadmap.
