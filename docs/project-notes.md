# FlipSide Player - Project Notes

## Project Vision & Requirements

### Core Vision Statement
*"Bringing the warmth and ritual of vinyl to the digital age"*

FlipSide Player aims to recreate the intentional, tactile experience of playing vinyl records while leveraging the convenience and vast catalog of digital streaming through Spotify.

### Primary Requirements

#### Functional Requirements
1. **Spotify Integration**
   - OAuth 2.0 authentication with user consent
   - Full access to Spotify's music catalog via Web API
   - Playback control via Spotify Web SDK
   - Cross-device control via Spotify Connect

2. **Vinyl-Inspired Interface**
   - Visual representation of spinning vinyl records
   - Large, prominent album artwork display
   - Tactile control elements reminiscent of turntables
   - Queue management like stacking physical records

3. **Core Music Features**
   - Play, pause, skip, and volume control
   - Search and browse Spotify's catalog
   - Build and manage playback queues
   - Transfer playback between devices

#### Non-Functional Requirements
1. **Performance**: Sub-second response times for all interactions
2. **Security**: Secure token management and user data protection
3. **Compatibility**: Works on modern web browsers (Chrome 90+, Safari 14+, Firefox 88+)
4. **Responsive**: Functional on desktop, tablet, and mobile devices
5. **Accessibility**: WCAG 2.1 AA compliance for inclusive design

### Target User Personas

#### Primary: "The Vinyl Enthusiast"
- **Demographics**: Ages 25-45, music lovers with disposable income
- **Behavior**: Appreciates analog aesthetics, values album art and liner notes
- **Pain Points**: Vinyl is expensive and limited; digital interfaces feel cold
- **Needs**: Beautiful music experience that respects the art form

#### Secondary: "The Design-Conscious Listener"  
- **Demographics**: Ages 20-35, design professionals and creative individuals
- **Behavior**: Seeks well-designed tools, values visual experiences
- **Pain Points**: Standard streaming apps lack visual appeal and engagement
- **Needs**: Aesthetically pleasing interface that enhances music discovery

#### Tertiary: "The Nostalgic Music Fan"
- **Demographics**: Ages 30-55, grew up with physical media
- **Behavior**: Misses the ritual of playing records, values music as experience
- **Pain Points**: Digital music lacks the ceremony and intention of vinyl
- **Needs**: Interface that brings back the mindful experience of choosing music

## Key Technical Decisions

### Authentication Architecture Decision

**Date**: January 2025  
**Decision**: Session-based authentication with Redis storage  
**Context**: Originally implemented JWT tokens, but encountered CORS and session persistence issues

**Options Considered:**
1. **JWT Tokens** (Initially implemented)
   - ✅ Stateless, scalable
   - ❌ CORS complexity with different origins
   - ❌ Token storage security concerns
   - ❌ Complex refresh token handling

2. **Session-based with Reverse Proxy** (Final choice)
   - ✅ Simple same-origin requests (no CORS)
   - ✅ Secure server-side token storage
   - ✅ Established session management patterns
   - ✅ Easy development and debugging
   - ❌ Requires Redis infrastructure

**Rationale**: Session-based approach eliminates CORS complexity while providing better security for sensitive Spotify tokens. Reverse proxy pattern aligns with deployment best practices.

### Frontend Framework Decision

**Date**: January 2025  
**Decision**: React with TypeScript and Vite  
**Context**: Need for interactive UI with real-time music control

**Options Considered:**
1. **Vanilla JavaScript**
   - ✅ No framework overhead
   - ❌ Complex state management for music player
   - ❌ Difficult to maintain as complexity grows

2. **React** (Chosen)
   - ✅ Excellent ecosystem for interactive UIs
   - ✅ Strong TypeScript support
   - ✅ Extensive third-party libraries
   - ✅ Team familiarity and community support

3. **Vue.js**
   - ✅ Simpler learning curve
   - ✅ Good TypeScript support
   - ❌ Smaller ecosystem compared to React

**Rationale**: React provides the best balance of performance, developer experience, and ecosystem support for building complex interactive applications.

### State Management Decision

**Date**: January 2025  
**Decision**: Zustand for client-side state management  
**Context**: Need lightweight, performant state management for music player

**Options Considered:**
1. **Redux Toolkit**
   - ✅ Powerful and battle-tested
   - ❌ Verbose boilerplate for simple use cases
   - ❌ Overkill for application size

2. **React Context**
   - ✅ Built into React
   - ❌ Performance issues with frequent updates
   - ❌ Complex for multiple stores

3. **Zustand** (Chosen)
   - ✅ Minimal boilerplate
   - ✅ Excellent performance
   - ✅ TypeScript-first design
   - ✅ Perfect size for application needs

**Rationale**: Zustand provides just the right amount of structure without overwhelming the application with unnecessary complexity.

### Backend Framework Decision

**Date**: January 2025  
**Decision**: Fastify with TypeScript  
**Context**: Need high-performance API server for proxying Spotify requests

**Options Considered:**
1. **Express.js**
   - ✅ Most popular Node.js framework
   - ✅ Extensive ecosystem
   - ❌ Slower performance compared to alternatives
   - ❌ No built-in TypeScript support

2. **Fastify** (Chosen)
   - ✅ Superior performance
   - ✅ Built-in TypeScript support
   - ✅ Schema-based validation
   - ✅ Plugin ecosystem
   - ❌ Smaller community than Express

3. **NestJS**
   - ✅ Enterprise-grade architecture
   - ✅ Excellent TypeScript support
   - ❌ Overkill for simple API proxy needs

**Rationale**: Fastify provides the performance characteristics needed for real-time music control while maintaining simplicity for our use case.

## Feature Development Priorities

### Phase 1: MVP (Completed)
- ✅ Spotify OAuth authentication
- ✅ Basic playback controls (play/pause/skip)
- ✅ Search functionality
- ✅ Queue management
- ✅ Device selection and control
- ✅ Vinyl deck visual component

### Phase 2: Enhanced Experience
- ⏳ Advanced vinyl animations (record scratching, speed changes)
- ⏳ Improved mobile responsiveness
- ⏳ Keyboard shortcuts for power users
- ⏳ Now playing notifications
- ⏳ Recently played history

### Phase 3: Social Features
- ❌ Playlist sharing and collaboration
- ❌ Social activity feeds
- ❌ Friend recommendations
- ❌ Listening parties and synchronized playback

### Phase 4: Advanced Features
- ❌ Local file support
- ❌ Advanced audio visualizations
- ❌ Smart queue suggestions based on listening history
- ❌ Integration with physical vinyl collection tracking

## Design System Decisions

### Color Palette Choice

**Decision**: Dark theme with Spotify green accents  
**Rationale**: 
- Dark backgrounds highlight album artwork
- Reduces eye strain during long listening sessions
- Spotify green maintains brand recognition
- Vinyl-inspired black and gold accents add warmth

### Typography Choice

**Decision**: Inter font family throughout  
**Rationale**:
- Excellent readability at various sizes
- Modern, clean aesthetic that doesn't compete with album art
- Strong Unicode support for international music titles
- Open source and web-optimized

### Animation Philosophy

**Decision**: Subtle, purposeful animations that enhance rather than distract  
**Rationale**:
- Music should be the focus, not flashy animations
- Vinyl rotation provides appropriate thematic movement
- Smooth transitions improve perceived performance
- Respect for users with motion sensitivity preferences

## Technical Constraints & Limitations

### Spotify API Limitations
- **Rate Limits**: Varying limits per endpoint (100-180 requests per minute)
- **Premium Required**: Playback control requires Spotify Premium subscription
- **Device Dependency**: Playback requires active Spotify device
- **Geographic Restrictions**: Some content not available in all regions

### Browser Limitations
- **Autoplay Policies**: Browsers restrict autoplay without user interaction
- **HTTPS Requirement**: Spotify Web SDK requires secure context
- **Cross-Origin Restrictions**: Strict CORS policies for audio content
- **Memory Constraints**: Large queues may impact performance on mobile devices

### Infrastructure Considerations
- **Redis Dependency**: Session management requires Redis server
- **Single Point of Failure**: Centralized session storage
- **Scaling Challenges**: Sessions tied to specific server instance
- **Memory Usage**: Session data accumulates over time

## Security Considerations

### Authentication Security
- **OAuth 2.0 PKCE**: Prevents authorization code interception
- **Session Storage**: Tokens stored server-side only
- **HTTPOnly Cookies**: Prevents XSS token theft
- **Secure Transport**: HTTPS required in production

### Data Privacy
- **Minimal Data Collection**: Only store essential user data
- **No Music Storage**: Never cache or store Spotify content
- **Session Expiration**: Automatic cleanup of expired sessions
- **User Consent**: Clear permissions during OAuth flow

### API Security
- **Input Validation**: All API inputs validated with Zod schemas
- **Error Handling**: Sensitive information not exposed in error messages
- **Rate Limiting**: Protection against abuse (future enhancement)
- **Environment Secrets**: All credentials stored securely

## Performance Requirements

### Response Time Targets
- **Page Load**: < 2 seconds initial load
- **Music Search**: < 500ms for search results
- **Playback Control**: < 100ms for play/pause response
- **Device Switching**: < 2 seconds for device transfer

### Resource Utilization
- **Memory Usage**: < 100MB peak usage in browser
- **Network Efficiency**: Minimize API calls through caching
- **Bundle Size**: < 1MB gzipped JavaScript bundle
- **Image Optimization**: Progressive loading for album artwork

## Future Considerations

### Scalability Planning
- **Horizontal Scaling**: Redis clustering for session storage
- **CDN Integration**: Static asset delivery optimization
- **API Caching**: Redis caching for frequently requested data
- **Database Migration**: Consider PostgreSQL for user preferences

### Mobile App Potential
- **React Native**: Leverage existing React knowledge
- **Native Features**: Offline capability, background playback
- **Platform Integration**: iOS/Android music controls integration
- **Performance**: Native performance for smooth animations

### Monetization Options
- **Premium Features**: Advanced queue management, analytics
- **Spotify Partnership**: Revenue sharing opportunities
- **White Label**: Custom versions for music venues/businesses
- **API Access**: Developer platform for third-party integrations

This document serves as a living record of the project's evolution, capturing both technical decisions and strategic direction for future reference and team alignment.