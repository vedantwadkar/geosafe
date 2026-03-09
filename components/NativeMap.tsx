import React, { forwardRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { getSafetyLevel } from '@/lib/api';

interface NativeMapProps {
  location: { latitude: number; longitude: number };
  safetyScore: number | null;
}

const NativeMap = forwardRef<any, NativeMapProps>(({ location, safetyScore }, ref) => {
  const level = safetyScore !== null ? getSafetyLevel(safetyScore) : null;

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFillObject}
      provider={PROVIDER_DEFAULT}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      showsUserLocation
      showsMyLocationButton={false}
      userInterfaceStyle="dark"
    >
      {/* SAFETY MARKER */}
      <Marker coordinate={location}>
        <View style={styles.markerContainer}>

          {safetyScore !== null && (
            <View style={styles.scoreLabel}>
              <Text style={styles.scoreText}>
                Safety Score: {safetyScore.toFixed(1)}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.markerOuter,
              { borderColor: level?.color || Colors.accent },
            ]}
          >
            <View
              style={[
                styles.markerInner,
                { backgroundColor: level?.color || Colors.accent },
              ]}
            >
              <Ionicons name="shield-checkmark" size={16} color="#fff" />
            </View>
          </View>

        </View>
      </Marker>

      {/* SAFETY AREA */}
      {level && (
        <Circle
          center={location}
          radius={500}
          fillColor={
            level.color === Colors.safe
              ? 'rgba(34, 197, 94, 0.12)'
              : level.color === Colors.moderate
              ? 'rgba(245, 158, 11, 0.12)'
              : 'rgba(239, 68, 68, 0.12)'
          }
          strokeColor={level.color}
          strokeWidth={2}
        />
      )}
    </MapView>
  );
});

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },

  scoreLabel: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },

  markerOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  markerInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NativeMap;