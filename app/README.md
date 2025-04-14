# Esusu App UI Guidelines

This document provides guidelines for developers working on the Esusu App to ensure a consistent UI across all screens.

## UI Components

### 1. StatusBarAdapter

Use the `StatusBarAdapter` component to ensure the status bar matches the current screen background.

```jsx
import StatusBarAdapter from "../components/StatusBarAdapter";

// At the top of your screen component:
<StatusBarAdapter backgroundColor="#0074FF" barStyle="light" />
```

### 2. HeaderContainer

Use the `HeaderContainer` component for all header sections to maintain consistent margins and padding:

```jsx
import HeaderContainer from "../components/HeaderContainer";

// In your screen:
<HeaderContainer backgroundColor="#FFFFFF">
  <Text>Your Header Content</Text>
</HeaderContainer>
```

### 3. StandardHeader

For screens with navigation headers, use the `StandardHeader` component:

```jsx
import StandardHeader from "../components/StandardHeader";

// In your screen:
<StandardHeader 
  title="Screen Title" 
  showBackButton={true} 
  backgroundColor="#FFFFFF" 
/>
```

### 4. NoScrollbarScrollView

Always use `NoScrollbarScrollView` instead of regular ScrollView to hide scrollbars across the app:

```jsx
import { NoScrollbarScrollView } from "../_layout";

// In your screen:
<NoScrollbarScrollView>
  <View>
    {/* Content */}
  </View>
</NoScrollbarScrollView>
```

## Loading State Management

Use the LoadingContext to handle loading states, especially during network requests:

```jsx
import { useLoading } from "../context/LoadingContext";

// In your component:
const { setLoading } = useLoading();

// When fetching data:
const fetchData = async () => {
  try {
    setLoading(true);
    // Your API call
  } catch (error) {
    // Error handling
  } finally {
    setLoading(false);
  }
};
```

## API Utilities

Use the API utility functions for all network requests to benefit from automatic loading state management:

```jsx
import { useApi } from "../utils/api";

// In your component:
const api = useApi();

// Making an API call with automatic loading state management:
const fetchData = async () => {
  try {
    const data = await api.get('/endpoint', {}, true); // true = show loading indicator
    // Process data
  } catch (error) {
    // Handle error
  }
};
```

## Consistency Guidelines

1. All screens should have the same header container placement and margin spacing
2. Always use the StatusBarAdapter to ensure status bar adapts to the current screen
3. Hide scrollbars by using NoScrollbarScrollView instead of ScrollView
4. Implement loading states via the LoadingContext for slow network operations 