# GeoSafe - Geo-safety Predictor

## Overview
A mobile safety prediction app that uses crime risk indexing to predict safety scores for the user's current location. Built with Expo React Native + Express backend.

## Architecture
- **Frontend**: Expo React Native with Expo Router (file-based routing)
- **Backend**: Express server on port 5000 that proxies requests to a FastAPI backend
- **State**: AsyncStorage for local persistence (contacts, feedback)
- **API**: POST /api/predict proxies to FastAPI backend at FASTAPI_URL environment variable

## Key Features
1. **Home Screen** - Shows location, safety score (0-10), color-coded risk level, user feedback rating
2. **Map Screen** - Native maps on iOS/Android with safety zone circle; web fallback with Google Maps link
3. **SOS Screen** - Emergency SOS button sends SMS with location to saved contacts every 5 minutes
4. **Profile Screen** - Manage emergency contacts (CRUD with AsyncStorage)

## Safety Score Levels
- Score >= 8: Safe Area (green)
- Score 5-7: Moderate Risk (yellow)
- Score < 5: High Risk Area (red)

## Environment Variables
- `FASTAPI_URL` - URL of the FastAPI backend (default: http://localhost:8000)
- The backend has a fallback score generator if FastAPI is unreachable

## Project Structure
- `app/(tabs)/` - Tab screens (index, map, sos, profile)
- `components/NativeMap.tsx` - Native map component (platform-specific with .web.tsx fallback)
- `lib/api.ts` - Safety score API calls
- `lib/storage.ts` - AsyncStorage helpers for contacts & feedback
- `lib/location.ts` - Location utilities
- `server/routes.ts` - Express API routes (proxy to FastAPI)

## Recent Changes
- 2026-02-20: Initial build of GeoSafe app with all 4 tabs, backend proxy, platform-specific map handling
