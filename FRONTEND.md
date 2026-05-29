# Frontend Development Guide

## Tech Stack

- **Framework**: Expo SDK 54 (React Native 0.81.5)
- **Language**: TypeScript 5.9
- **Navigation**: Expo Router 6 (file-based routing)
- **State Management**: Zustand 5
- **Database**: Expo SQLite 16
- **Storage**: React Native MMKV
- **Styling**: React Native StyleSheet
- **Icons**: @expo/vector-icons (Ionicons)

## Development Setup

### Prerequisites
- Node.js 18+ 
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation
```bash
npm install
npx expo prebuild
```

### Development Commands
```bash
npm run start          # Start Expo dev server
npm run android        # Run on Android emulator/device
npm run ios           # Run on iOS simulator/device
npm run web           # Run in web browser
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint errors
npm run format        # Format with Prettier
npm run format:check  # Check formatting
npm run typecheck     # TypeScript type check
npm run clean         # Clean build artifacts
```

## Project Structure

```
App/Agent/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Tasks screen
│   │   ├── calendar.tsx   # Calendar screen
│   │   ├── inbox.tsx      # Inbox screen
│   │   └── agent.tsx      # AI Agent screen
│   └── settings.tsx       # Settings modal
├── src/
│   ├── components/        # Reusable UI components
│   ├── stores/           # Zustand state stores
│   ├── services/         # Business logic & API calls
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions
├── modules/              # Native modules
│   └── llama-cpp/        # Offline AI native module
└── backend/              # Express backend (optional)
```

## Architecture

### State Management
- **Zustand stores** for global state (tasks, calendar, inbox, agent, settings)
- **SQLite** for persistent local data
- **MMKV** for fast key-value storage (settings, tokens)

### Key Features
1. **Offline-first** - All data stored locally, syncs when online
2. **AI Agent** - Runs Qwen2-1.5B locally via llama-cpp
3. **Unified Inbox** - Email + social media feeds
4. **Calendar** - Day/Week/Month/Agenda views with Google sync
5. **Task Management** - Subtasks, priorities, attachments

## Component Guidelines

### Naming
- Components: PascalCase (e.g., `TaskCard.tsx`)
- Utilities: camelCase (e.g., `date.ts`)
- Stores: camelCase with Store suffix (e.g., `taskStore.ts`)

### Icons
Use Ionicons from @expo/vector-icons:
```tsx
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="checkmark-outline" size={24} color={colors.primary} />
```

### Colors
Import from `src/utils/colors`:
```tsx
import { Colors } from '../utils/colors';

const colors = Colors[isDark ? 'dark' : 'light'];
```

### Common Icons Reference
- Tasks: `checkbox-outline`, `square-outline`
- Calendar: `calendar-outline`
- Inbox: `mail-outline`, `mail-open-outline`
- Agent: `chatbubbles-outline`, `sparkles`
- Settings: `settings-outline`
- Navigation: `chevron-back`, `chevron-forward`
- Search: `search-outline`, `close-circle`
- Add: `add`, `add-circle-outline`
- Delete: `trash-outline`
- Edit: `create-outline`

## Code Style

### TypeScript
- Use strict mode
- Explicit return types for functions
- Interface over type for object shapes
- Proper null/undefined handling

### React Components
- Functional components with hooks
- useCallback for event handlers
- useMemo for expensive computations
- Proper dependency arrays

### Example Component
```tsx
import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/colors';

interface MyComponentProps {
  title: string;
  onPress: () => void;
}

export function MyComponent({ title, onPress }: MyComponentProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={handlePress}
    >
      <Ionicons name="sparkles" size={24} color={colors.primary} />
      <Text style={[styles.text, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
}
```

## Testing

### Manual Testing Checklist
- [ ] TypeScript compiles without errors
- [ ] All screens render correctly in light/dark mode
- [ ] Navigation works (tabs, modals, deep links)
- [ ] State persists across app restarts
- [ ] Offline mode works (airplane mode test)
- [ ] Notifications appear correctly
- [ ] Calendar sync works (if configured)

## Build & Deploy

### Android
```bash
npm run build:android
# or
eas build --platform android --profile production
```

### iOS
```bash
npm run build:ios
# or
eas build --platform ios --profile production
```

### Development Builds
```bash
eas build --platform android --profile development
eas build --platform ios --profile development
```

## Troubleshooting

### Common Issues

**TypeScript errors after adding native module:**
```bash
npx expo prebuild --clean
npm run typecheck
```

**Metro bundler cache issues:**
```bash
npm run clean
npm start -- --clear
```

**iOS pod issues:**
```bash
cd ios
pod install
cd ..
```

**Android build issues:**
```bash
cd android
./gradlew clean
cd ..
```

## Resources

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Router](https://expo.github.io/router/docs/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Ionicons](https://icons.expo.fyi/)