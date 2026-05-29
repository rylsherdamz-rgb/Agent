# Mobile Frontend Development Skills

## Installed Packages & Libraries

### Core React Native
- ✅ `react-native` v0.81.5
- ✅ `react` v19.2.6
- ✅ `expo` v54.0.33
- ✅ `expo-router` v6.0.23 (File-based routing)

### UI & Navigation
- ✅ `@expo/vector-icons` v15.0.3 (Ionicons, MaterialIcons, etc.)
- ✅ `react-native-reanimated` v4.1.1 (Smooth animations)
- ✅ `react-native-gesture-handler` v2.28.0 (Touch gestures)
- ✅ `react-native-screens` v4.16.0 (Native screens)
- ✅ `react-native-safe-area-context` v5.6.0 (Safe areas)

### State Management & Storage
- ✅ `zustand` v5.0.13 (Lightweight state management)
- ✅ `react-native-mmkv` v4.3.1 (Fast key-value storage)
- ✅ `expo-sqlite` v16.0.10 (Local database)
- ✅ `expo-secure-store` v15.0.8 (Secure token storage)

### Expo Modules
- ✅ `expo-calendar` - Calendar access & events
- ✅ `expo-notifications` - Push notifications
- ✅ `expo-image-picker` - Image selection
- ✅ `expo-document-picker` - Document selection
- ✅ `expo-file-system` - File operations
- ✅ `expo-media-library` - Media access
- ✅ `expo-task-manager` - Background tasks
- ✅ `expo-background-fetch` - Background data fetching

### Development Tools
- ✅ `typescript` v5.9.2
- ✅ `eslint` + plugins (React, React Native, TypeScript)
- ✅ `prettier` (Code formatting)
- ✅ `@types/react` - TypeScript definitions

### AI/ML Skills
- ✅ `@xenova/transformers` - In-browser ML inference
- ✅ `llama-cpp` (native module) - Offline LLM execution

## Available NPM Scripts

```bash
npm run start          # Start Expo dev server
npm run android        # Run on Android device/emulator
npm run ios            # Run on iOS simulator
npm run web            # Run in web browser
npm run lint           # Lint code with ESLint
npm run lint:fix       # Auto-fix lint issues
npm run format         # Format code with Prettier
npm run format:check   # Check formatting
npm run typecheck      # TypeScript type checking
npm run clean          # Clean build artifacts
npm run prebuild       # Generate native projects
npm run build:android  # Build Android APK/AAB
npm run build:ios      # Build iOS app
```

## Mobile Development Best Practices

### 1. Component Structure
```typescript
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title: string;
  onPress: () => void;
}

export function MyComponent({ title, onPress }: Props) {
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Ionicons name="sparkles" size={24} color="#1A73E8" />
      <Text>{title}</Text>
    </TouchableOpacity>
  );
}
```

### 2. State Management with Zustand
```typescript
import { create } from 'zustand';

interface Store {
  items: string[];
  addItem: (item: string) => void;
}

export const useStore = create<Store>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
}));
```

### 3. AsyncStorage vs MMKV
```typescript
// Use MMKV for fast synchronous storage
import { storage } from './services/storage';

// Save
storage.set('key', 'value');

// Load
const value = storage.getString('key');

// Delete
storage.delete('key');
```

### 4. Navigation with Expo Router
```typescript
import { router, useLocalSearchParams } from 'expo-router';

// Navigate
router.push('/settings');
router.push({
  pathname: '/task/[id]',
  params: { id: '123' },
});

// Get params
const { id } = useLocalSearchParams();
```

### 5. Safe Area Handling
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

<View style={{
  paddingTop: insets.top,
  paddingBottom: insets.bottom,
  paddingLeft: insets.left,
  paddingRight: insets.right,
}} />
```

### 6. Animations with Reanimated
```typescript
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';

const scale = useSharedValue(1);

const handlePress = () => {
  scale.value = withSpring(1.2);
};

<Animated.View style={{ transform: [{ scale }] }} />
```

## Mobile-Specific Optimizations

### Performance
- ✅ Use `React.memo()` for expensive components
- ✅ Implement `shouldComponentUpdate` or `PureComponent`
- ✅ Use `useCallback` and `useMemo` for stable references
- ✅ FlatList with `getItemLayout` for long lists
- ✅ Image optimization with `expo-image`

### Memory Management
- ✅ Clean up subscriptions in `useEffect` cleanup
- ✅ Use weak references for large objects
- ✅ Implement proper unmounting handlers
- ✅ Monitor memory usage in production

### Battery Optimization
- ✅ Minimize background fetch frequency
- ✅ Use efficient animations (native driver)
- ✅ Debounce/throttle user input handlers
- ✅ Batch network requests

## Testing Strategy

### Unit Tests
```bash
npm install --save-dev jest @testing-library/react-native
```

### E2E Tests
```bash
npm install --save-dev detox
```

### Manual Testing Checklist
- [ ] Test on different screen sizes
- [ ] Test in light/dark mode
- [ ] Test offline functionality
- [ ] Test memory usage
- [ ] Test battery impact
- [ ] Test on slow networks

## Build & Deployment

### Android Build
```bash
# Development
eas build --platform android --profile development

# Production
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

### iOS Build
```bash
# Development
eas build --platform ios --profile development

# Production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

## Debugging Tools

### React Native Debugger
```bash
npm install -g react-native-debugger
```

### Flipper
```bash
npm install --save-dev react-native-flipper
```

### React DevTools
```bash
npm install --save-dev @react-devtools/core
```

## Common Issues & Solutions

### Issue: Metro Bundler Cache
```bash
npm run clean
npm start -- --reset-cache
```

### Issue: TypeScript Errors
```bash
npm run typecheck
npx tsc --noEmit
```

### Issue: iOS Pods
```bash
cd ios
pod install
cd ..
```

### Issue: Android Gradle
```bash
cd android
./gradlew clean
cd ..
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Router](https://expo.github.io/router/docs/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Native Directory](https://reactnative.directory/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://material.io/design)