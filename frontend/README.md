# Malar Market Ledger - Frontend PWA

A Progressive Web App (PWA) for the Malar flower market digital ledger system, optimized for high-speed data entry during morning rush hours (4-9 AM).

## Features

- **Offline-First PWA**: Works completely offline during morning rush hours with automatic sync when connection restored
- **Bilingual Support**: Full English and Tamil (தமிழ்) language support with RTL layout
- **Role-Based UI**: Different interfaces for Admin, Staff, and Farmer roles
- **High-Speed Entry**: Keyboard-first design with Tab navigation for rapid data entry
- **Tablet Optimized**: Landscape-first design optimized for tablet use
- **Real-Time Sync**: Background sync of pending entries when online
- **Visual Feedback**: Instant green checkmarks on successful saves, color-coded adjustments

## Tech Stack

- **Frontend**: React 18.3 + Vite
- **PWA**: Service Worker with IndexedDB for offline storage
- **Styling**: Tailwind CSS with custom components (no UI library)
- **i18n**: i18next for bilingual support
- **State Management**: React Context + Hooks
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router DOM v6

## Design Philosophy

**Aesthetic Direction**: Industrial/Utilitarian with warmth
- Clean, functional design with high contrast for early morning visibility
- Subtle floral-inspired accent colors (deep magenta/purple, emerald green, crimson red)
- Distinctive typography: Playfair Display (display) + Source Sans Pro (body)
- Dominant neutral (warm gray/cream) with sharp accent colors
- NO generic fonts like Inter, Roboto, Arial
- NO generic color schemes like purple gradients on white

## Project Structure

```
frontend/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service Worker
│   └── icons/                 # PWA icons
├── src/
│   ├── main.jsx               # Entry point
│   ├── App.jsx                # Root component with routing
│   ├── index.css              # Global styles
│   ├── components/            # Reusable components
│   │   ├── layout/         # Layout components
│   │   ├── form/           # Form components
│   │   ├── data/           # Data display components
│   │   ├── feedback/       # Feedback components
│   │   └── entry/          # Entry-specific components
│   ├── pages/                 # Page components
│   ├── hooks/                 # Custom hooks
│   ├── context/               # React Context providers
│   ├── services/              # API services
│   ├── store/                 # IndexedDB offline store
│   ├── utils/                 # Utility functions
│   └── i18n/                  # i18next configuration
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

## Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` to configure your API base URL:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Running the App

### Development Mode
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## PWA Features

### Installation
The app can be installed as a PWA on supported devices:
- Desktop: Chrome, Edge, Firefox (modern versions)
- Mobile: Chrome on Android, Safari on iOS 16.4+

### Offline Functionality
1. **Service Worker**: Caches app shell and API responses
2. **IndexedDB**: Stores pending entries, farmers cache, market rates cache
3. **Background Sync**: Automatically syncs pending data when connection restored
4. **Sync Queue**: Visual indicator shows number of pending sync items

### Offline Storage
The app uses IndexedDB for offline storage with the following stores:
- `pending_entries`: Daily entries created while offline
- `farmers_cache`: Cached farmer data for quick access
- `market_rates_cache`: Cached market rate data
- `sync_queue`: Queue of items to sync when online

## Bilingual Support

### Switching Languages
Language can be switched using the language toggle in the header or settings page.

### Supported Languages
- **English**: Left-to-right layout
- **Tamil (தமிழ்)**: Right-to-left layout with Tamil font

### RTL Support
Tamil language automatically switches to RTL layout for proper text direction.

## Role-Based Access

### Admin Role
- Full access to all modules
- Can manage users and system settings
- Can approve settlements and cash advances
- Can manage market rates

### Staff Role
- Can create and edit daily entries
- Can manage farmers
- Can view market rates (read-only)
- Can create cash advances
- Cannot access settlements or system settings

### Farmer Role
- Can view own daily entries
- Can view own cash advances
- Can view own settlements
- Limited to viewing own data only

## API Integration

The frontend integrates with the backend API using standard response envelope format:

```typescript
{
  success: true,
  data: {...},
  message: "Success message"
}
```

### Authentication
- JWT-based authentication with automatic token refresh
- Tokens stored in localStorage
- Automatic logout on token expiration

### Error Handling
- Network errors handled gracefully
- API errors displayed as user-friendly messages
- Offline mode shows appropriate indicators

## Keyboard Navigation

### Daily Entry Form
- **Tab**: Navigate between fields
- **Enter**: Save current entry and move to next row
- **Escape**: Cancel current entry
- **Arrow Keys**: Navigate between rows (when implemented)

### Shortcuts
- `Ctrl/Cmd + S`: Save current form
- `Ctrl/Cmd + N`: New entry
- `Ctrl/Cmd + F`: Search
- `Ctrl/Cmd + /`: Focus search

## Development

### File Organization
- **Components**: Reusable UI components
- **Pages**: Route-level page components
- **Hooks**: Custom React hooks for logic reuse
- **Context**: Global state management
- **Services**: API communication layer
- **Store**: Offline data persistence
- **Utils**: Helper functions

### Code Style
- Functional components with hooks
- Clear separation of concerns
- Consistent naming conventions
- JSDoc comments for functions
- TypeScript-style JSDoc for better IDE support

## Browser Support

### Minimum Requirements
- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

### Recommended
- Latest Chrome or Edge for best PWA experience
- Tablet device for optimal workflow

## Performance Optimization

- Code splitting with React.lazy
- Image optimization
- Service worker caching strategy
- IndexedDB for offline data
- Debounced search and API calls
- Memoized components where appropriate

## Security

- HTTPS required for PWA installation
- JWT tokens for authentication
- XSS protection through React escaping
- CSRF protection via backend
- Secure storage practices

## Troubleshooting

### Service Worker Not Registering
1. Check browser console for errors
2. Ensure serving over HTTPS or localhost
3. Clear service worker cache in DevTools
4. Unregister and re-register if needed

### Offline Data Not Syncing
1. Check network connection
2. Verify backend is accessible
3. Check sync queue count
4. Review service worker logs

### Build Errors
1. Clear `.vite` cache: `rm -rf node_modules/.vite`
2. Reinstall dependencies: `npm install`
3. Check for dependency conflicts

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Hosting
The `dist/` folder can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting service

### Environment Variables
Set production environment variables in your hosting platform:
- `VITE_API_BASE_URL`: Production API URL

## Contributing

When contributing:
1. Follow existing code style
2. Add JSDoc comments for new functions
3. Test offline functionality
4. Test both English and Tamil languages
5. Test all user roles

## License

Proprietary - All rights reserved
