# Chat Meeting Scheduler

Automatically detects date/time references in chat messages and generates calendar events.

## Quick Start

```bash
npm install
npm start
```

## How It Works

The system processes natural language messages and:
1. **Parses** temporal expressions (dates/times)
2. **Extracts** meeting details (title, participants, location, duration)
3. **Validates** the information
4. **Creates** calendar events

## Example Messages

```
"Team standup tomorrow at 10am for 30 minutes"
→ Creates event: Team standup, Dec 4 at 10:00 AM, 30 min

"Let's meet with John and Sarah next Tuesday at 3pm in Conference Room A"
→ Creates event: Let's meet with John and Sarah, Dec 9 at 3:00 PM, 60 min
→ Participants: John, Sarah
→ Location: Conference Room A

"Coffee chat on Friday at 2pm https://meet.google.com/abc-defg-hij"
→ Creates event: Coffee chat, Dec 5 at 2:00 PM, 60 min
→ Location: https://meet.google.com/abc-defg-hij
```

## Current Implementation

This is a minimal working prototype with:
- ✅ Temporal expression parsing (chrono-node)
- ✅ Meeting detail extraction
- ✅ Validation
- ✅ Mock calendar API client

## Next Steps

To connect to a real calendar:
1. Set up Google Calendar API credentials
2. Replace `CalendarAPIClient` with real API calls
3. Add OAuth2 authentication
4. Implement duplicate detection
5. Add retry logic and error handling
