# RoadScan - Mobile App Development Plan

## 📊 Development Progress

### ✅ Completed Phases

- **Phase 1-3**: Project Setup & Navigation (Week 1-4) ✅
  - Expo/React Native project initialized
  - Navigation structure complete
  - All 7 screens created with basic layout
  - TypeScript configuration complete

- **Phase 4**: Scan Feature - Core Functionality (Week 5-6) ✅
  - Sensor data collection (accelerometer, gyroscope)
  - GPS location tracking with Haversine distance
  - Roughness calculation algorithm (RMS-based)
  - Real-time map visualization with color-coded segments
  - Scan controls (start/pause/resume/stop)
  - See: `docs/PHASE4_SUMMARY.md`

- **Phase 5-6**: Data Persistence & Core Features (Week 6-8) ✅
  - Supabase backend integration
  - Offline-first architecture with SQLite
  - Sync service with auto-sync and network detection
  - Authentication (optional, offline-capable)
  - History feature (view, delete scans)
  - Graphs & Statistics (weekly patterns, roughness charts)
  - Account management (profile, phone/vehicle info)
  - See: `docs/PHASE5-6_SUMMARY.md`

- **Phase 6-7**: History & Graphs - Advanced Features (Week 7-9) ✅
  - Checkbox selection for session overlay
  - Map visualization of selected sessions
  - Search/filter by date
  - Roughness histogram distribution
  - Time-series roughness chart
  - Speed distribution chart
  - Detailed summary statistics
  - CSV export functionality
  - See: `docs/PHASE6-7_COMPLETION.md`

- **Phase 7** (renumbered as Phase 8): Resources, Help & Onboarding (Week 9) ✅
  - Resources screen with external links
  - Help/FAQ documentation with 10 questions
  - Interactive onboarding tutorial (5 slides)
  - First-launch detection with AsyncStorage
  - Tutorial restart capability
  - See: `docs/PHASE7_SUMMARY.md`

### 🚧 Current Phase: Phase 8 (formerly 9) - Polish & UX Improvements

### 📋 Remaining Phases

- **Phase 8**: Polish & UX Improvements (Week 10-11)
- **Phase 9**: Algorithm Calibration (Week 12)
- **Phase 10**: Admin Dashboard (Week 13-14)
- **Phase 11**: Beta Testing & Launch (Week 15)

---

## Executive Summary
A cross-platform mobile application that measures road roughness using device sensors and provides real-time visualization, historical data analysis, and user insights.

---

## Technology Stack Recommendation

### Mobile App Framework
**Recommended: React Native with Expo**

**Rationale:**
- ✅ Single codebase for iOS and Android
- ✅ Excellent sensor access (accelerometer, gyroscope, magnetometer)
- ✅ Strong geolocation support
- ✅ Large ecosystem with mapping libraries
- ✅ Expo provides easier development workflow with managed services
- ✅ Can eject to bare React Native if advanced native features needed

**Alternative:** Flutter (if team prefers Dart and wants excellent performance)

### Key Mobile Libraries
- **expo-location** - Geolocation with background tracking
- **expo-sensors** - Accelerometer, Gyroscope, Magnetometer access
- **react-native-maps** or **MapLibre GL Native** - Map visualization
- **@react-navigation/native** - Navigation between screens
- **react-native-chart-kit** or **Victory Native** - Data visualization
- **AsyncStorage** or **expo-sqlite** - Local data persistence
- **axios** - HTTP client for API calls

### Backend Architecture
**Recommended: Node.js + Express + PostgreSQL + Supabase**

**Rationale:**
- ✅ Supabase provides: Authentication, Database (PostgreSQL), Storage, Real-time subscriptions
- ✅ Open-source Firebase alternative
- ✅ Built-in REST API and Row Level Security
- ✅ PostGIS extension for geospatial queries
- ✅ Easy admin dashboard creation

**Alternative Stack:**
- Firebase (easier but vendor lock-in)
- Node.js + Express + MongoDB + AWS (more control, more setup)

### Database Schema (PostgreSQL)
```sql
-- Users
users (
  id uuid primary key,
  email text unique,
  phone_model text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  created_at timestamp,
  updated_at timestamp
)

-- Scan Sessions
scan_sessions (
  id uuid primary key,
  user_id uuid references users(id),
  started_at timestamp,
  ended_at timestamp,
  total_distance_km float,
  average_roughness float,
  status text, -- 'active', 'paused', 'completed'
  created_at timestamp
)

-- Sensor Data Points
sensor_data_points (
  id uuid primary key,
  session_id uuid references scan_sessions(id),
  timestamp timestamp,
  latitude float,
  longitude float,
  altitude float,
  speed float,
  acceleration_x float,
  acceleration_y float,
  acceleration_z float,
  gyro_x float,
  gyro_y float,
  gyro_z float,
  roughness_score float, -- calculated metric (0-100)
  created_at timestamp
)

-- Aggregated Segments (for map visualization)
scan_segments (
  id uuid primary key,
  session_id uuid references scan_sessions(id),
  start_lat float,
  start_lng float,
  end_lat float,
  end_lng float,
  geometry geography(LINESTRING, 4326), -- PostGIS for efficient geospatial queries
  average_roughness float,
  segment_duration_seconds integer,
  created_at timestamp
)
```

### Admin Dashboard
**Recommended: Next.js + Supabase Admin SDK**
- Server-side rendered dashboard
- Visualize user data, scan statistics
- Export capabilities
- User management

---

## Development Phases

### Phase 1: Project Setup & Core Infrastructure (Week 1-2)
**Deliverables:**
- ✅ Initialize React Native/Expo project
- ✅ Set up Supabase backend
- ✅ Configure CI/CD pipeline
- ✅ Set up development, staging, production environments
- ✅ Create database schema
- ✅ Basic authentication flow

**Tasks:**
1. Initialize Expo project with TypeScript
2. Set up folder structure
3. Configure Supabase project
4. Create database tables and RLS policies
5. Set up ESLint, Prettier, and TypeScript configs
6. Create basic navigation structure

### Phase 2: Authentication & Onboarding (Week 2-3)
**Deliverables:**
- ✅ Onboarding screens (3-4 screens)
- ✅ Account creation flow
- ✅ Permission requests (location, sensors)
- ✅ Login/logout functionality

**Key Considerations:**
- Clear explanation of why location is needed
- Graceful handling of permission denials
- Store user preferences locally

### Phase 3: Main Landing Page & Navigation (Week 3-4)
**Deliverables:**
- ✅ 6-tile landing page
- ✅ Navigation to all main sections
- ✅ Basic UI/UX design implementation

### Phase 4: Scan Feature - Core Functionality (Week 4-6)
**Deliverables:**
- ✅ Sensor data collection (accelerometer, gyro)
- ✅ Real-time geolocation tracking
- ✅ Background location tracking
- ✅ Local data buffering
- ✅ Roughness calculation algorithm

**Technical Implementation:**

#### Sensor Sampling Strategy
```javascript
// Sample at 50-100 Hz for high-frequency sensor data
const SENSOR_SAMPLE_RATE = 100; // ms
const GPS_SAMPLE_RATE = 1000; // ms (1 Hz)
const SEGMENT_DURATION = 5000; // 5 seconds

// Data Collection Strategy:
// 1. Collect raw sensor data at high frequency
// 2. Buffer in memory (last 5 seconds)
// 3. Calculate roughness score every 5 seconds
// 4. Send aggregated data to backend
// 5. Store raw data locally for 24h, then delete
```

#### Roughness Calculation Algorithm (Initial)
```javascript
// Simple algorithm - can be refined
function calculateRoughnessScore(accelerometerData) {
  // 1. Remove gravity component
  // 2. Calculate vertical acceleration variance
  // 3. Apply band-pass filter (0.5-20 Hz) to remove noise
  // 4. Calculate RMS (Root Mean Square)
  // 5. Normalize to 0-100 scale
  // 6. Consider speed (higher speed = amplify bumps)
  
  // Returns: roughness score (0 = smooth, 100 = very rough)
}
```

**Data Storage Strategy:**
- **Local (Device):** Raw sensor data for last 24 hours
- **Backend:** Aggregated 5-second segments (permanent)
- **Sync:** Upload segments when WiFi available or immediately if cellular data allowed

### Phase 5: Scan Feature - Map Visualization (Week 6-7)
**Deliverables:**
- ✅ Full-screen map interface
- ✅ Real-time path plotting
- ✅ Color-coded segments (green = smooth, yellow = moderate, red = rough)
- ✅ Start/Stop/Pause/Resume controls
- ✅ Current stats display (speed, distance, duration)

**Map Libraries:**
- Primary: `react-native-maps` (easier setup)
- Alternative: `@maplibre/maplibre-react-native` (more customization)

### Phase 6: History Feature (Week 7-8)
**Deliverables:**
- ✅ List of past scan sessions
- ✅ Session details (date, duration, distance, avg roughness)
- ✅ Checkbox selection for overlay
- ✅ Map visualization of selected sessions
- ✅ Delete functionality
- ✅ Search/filter by date

**Status:** Complete ✅ - See `docs/PHASE6-7_COMPLETION.md`

### Phase 7: Graphs & Statistics (Week 8-9)
**Deliverables:**
- ✅ Weekly distance bar chart
- ✅ Roughness histogram (per-minute bins)
- ✅ Time-series roughness over last scan
- ✅ Speed distribution chart
- ✅ Summary statistics (total distance, avg speed, roughest road)
- ✅ Export data to CSV

**Chart Library:** Victory Native or react-native-chart-kit  
**Status:** Complete ✅ - See `docs/PHASE6-7_COMPLETION.md`

### Phase 8: Resources, Help & Account Pages (Week 9-10)
**Deliverables:**
- ✅ Resources page with external links
- ✅ Help documentation with FAQs
- ✅ Account management (profile editing)
- ✅ Vehicle and phone information fields
- ✅ Settings (units, data sync preferences)

### Phase 9: Backend API & Data Pipeline (Week 10-11)
**Deliverables:**
- ✅ REST API endpoints
- ✅ Data ingestion pipeline
- ✅ User authentication middleware
- ✅ Rate limiting
- ✅ Error handling and logging
- ✅ Data validation

**Key Endpoints:**
```
POST /api/sessions/start
POST /api/sessions/:id/segments
POST /api/sessions/:id/end
GET /api/sessions
GET /api/sessions/:id
DELETE /api/sessions/:id
GET /api/stats/weekly
GET /api/stats/summary
```

### Phase 10: Admin Dashboard (Week 11-12)
**Deliverables:**
- ✅ User management interface
- ✅ System-wide statistics
- ✅ Individual user scan history
- ✅ Data export capabilities
- ✅ Heatmap of all scans (aggregate view)
- ✅ Authentication for admin access

### Phase 11: Testing & Optimization (Week 12-13)
**Deliverables:**
- ✅ Unit tests for roughness algorithm
- ✅ Integration tests for API
- ✅ End-to-end testing on real devices
- ✅ Performance optimization
- ✅ Battery usage optimization
- ✅ Offline capability testing
- ✅ Cross-device calibration

### Phase 12: Beta Release & Iteration (Week 13-14)
**Deliverables:**
- ✅ TestFlight (iOS) and Google Play Beta release
- ✅ Collect user feedback
- ✅ Bug fixes
- ✅ Algorithm refinement based on real-world data

### Phase 13: Production Release (Week 15)
**Deliverables:**
- ✅ App Store submission
- ✅ Google Play submission
- ✅ Marketing materials
- ✅ Documentation

---

## Key Technical Considerations

### 1. Sensor Calibration
- Different phone models have different sensor sensitivities
- Vehicle type significantly affects readings
- Need baseline calibration per device/vehicle combination
- Consider machine learning model for normalization

### 2. Battery Optimization
- Background location tracking is battery-intensive
- Implement adaptive sampling (lower rate when stationary)
- Use significant location changes instead of continuous tracking
- Warn users about battery impact

### 3. Data Privacy
- Clear privacy policy
- Anonymize location data in analytics
- Allow users to opt-out of data sharing
- GDPR/CCPA compliance

### 4. Algorithm Accuracy
- Start with simple RMS-based roughness calculation
- Collect labeled data (users rate road quality)
- Train ML model to improve accuracy
- Consider International Roughness Index (IRI) standards

### 5. Offline Functionality
- App should work without internet
- Queue data for upload when connected
- Local storage management (auto-delete old data)

### 6. Performance
- Use React Native's new architecture (if using RN 0.70+)
- Optimize map rendering (limit points rendered)
- Use memoization for expensive calculations
- Profile with React DevTools and Flipper

---

## Folder Structure

```
roadscan/
├── mobile/                    # React Native/Expo app
│   ├── src/
│   │   ├── screens/          # Screen components
│   │   │   ├── Onboarding/
│   │   │   ├── Home/
│   │   │   ├── Scan/
│   │   │   ├── History/
│   │   │   ├── Graphs/
│   │   │   ├── Resources/
│   │   │   ├── Help/
│   │   │   └── Account/
│   │   ├── components/       # Reusable components
│   │   ├── navigation/       # Navigation config
│   │   ├── services/         # API, sensors, location
│   │   │   ├── api.ts
│   │   │   ├── sensors.ts
│   │   │   ├── location.ts
│   │   │   └── roughness.ts
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Helper functions
│   │   ├── types/            # TypeScript types
│   │   ├── store/            # State management (Redux/Zustand)
│   │   └── constants/        # App constants
│   ├── assets/               # Images, fonts
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
├── backend/                   # Supabase functions (optional)
│   └── supabase/
│       ├── functions/        # Edge functions
│       └── migrations/       # Database migrations
├── admin-dashboard/          # Next.js admin panel
│   ├── pages/
│   ├── components/
│   └── lib/
├── docs/                     # Documentation
├── scripts/                  # Utility scripts
└── README.md
```

---

## Development Environment Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (Mac only)
- Android: Android Studio
- Git
- Supabase account

### Initial Setup Commands
```bash
# Initialize Expo project
npx create-expo-app mobile --template expo-template-blank-typescript

# Navigate to mobile directory
cd mobile

# Install key dependencies
npx expo install expo-location expo-sensors react-native-maps
npx expo install @react-navigation/native @react-navigation/stack
npx expo install @supabase/supabase-js
npx expo install react-native-chart-kit react-native-svg
npx expo install expo-sqlite

# Start development server
npx expo start
```

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sensor data quality varies by device | High | Implement calibration + ML normalization |
| Battery drain complaints | High | Optimize sampling, clear user communication |
| Location permission denial | Critical | Educate users, graceful degradation |
| Backend costs scale with users | Medium | Implement data retention policies, optimize storage |
| Algorithm accuracy | High | Start simple, iterate with real data, user feedback |
| App store rejection | Medium | Follow guidelines strictly, prepare appeal |

---

## Success Metrics

### Phase 1 (MVP)
- ✅ App launches and collects sensor data
- ✅ Basic roughness calculation works
- ✅ Map visualization displays colored path
- ✅ Data persists across sessions

### Phase 2 (Beta)
- ✅ 50+ beta testers
- ✅ 500+ scan sessions collected
- ✅ <5% crash rate
- ✅ Algorithm validation with user feedback

### Phase 3 (Launch)
- ✅ 1,000+ downloads in first month
- ✅ 4.0+ star rating
- ✅ 10,000+ km of roads scanned
- ✅ <2% crash rate

---

## Cost Estimates

### Development (Assuming 1-2 developers)
- Development time: 13-15 weeks
- Developer cost: $Variable based on location/rate

### Infrastructure (Monthly)
- Supabase: $0 (free tier) to $25/month (pro tier)
- Hosting admin dashboard: $0 (Vercel free) to $20/month
- **Estimated: $0-50/month for small scale**

### Scaling Costs (1,000 active users)
- Database storage: ~$10-20/month
- Bandwidth: ~$20-30/month
- **Estimated: $30-100/month**

---

## Next Steps

1. **Validate tech stack** - Confirm React Native + Expo + Supabase approach
2. **Set up development environment** - Install tools, create accounts
3. **Initialize project** - Create Expo app, set up folder structure
4. **Create Supabase project** - Set up database, authentication
5. **Build MVP** - Focus on Scan feature first
6. **Iterate based on testing** - Real-world testing is critical

---

## Questions to Address

1. **Data Retention:** How long should we keep raw sensor data vs aggregated data?
2. **Monetization:** Will this be free, freemium, or paid?
3. **Data Sharing:** Will users' data contribute to a public road quality map?
4. **Branding:** App name finalized? Need logo/design?
5. **Team:** Who will be developing this? Do you need help finding developers?
6. **Timeline:** Is 13-15 weeks acceptable or do we need to accelerate?

