# Design Document

## Overview

The Chat Meeting Scheduler is a natural language processing system that automatically detects temporal expressions in chat messages and creates corresponding calendar events. The system consists of three main layers: an NLP parsing layer that extracts temporal information, a business logic layer that processes and validates meeting details, and an integration layer that communicates with calendar APIs.

The design emphasizes modularity, testability, and extensibility to support various temporal expression patterns and multiple calendar providers.

## Architecture

The system follows a pipeline architecture with clear separation of concerns:

```
Chat Message Input → NLP Parser → Meeting Extractor → Validator → Calendar API Client → Calendar Event
```

### Key Components:

1. **NLP Parser**: Extracts temporal expressions and converts them to structured date-time objects
2. **Meeting Extractor**: Analyzes message context to extract title, participants, location, and duration
3. **Validator**: Ensures extracted information is valid and handles edge cases
4. **Duplicate Detector**: Checks for existing similar events in the calendar
5. **Calendar API Client**: Manages communication with external calendar services
6. **Event Queue**: Handles retry logic for failed API calls

## Components and Interfaces

### NLP Parser

**Responsibility**: Parse natural language text to extract temporal expressions and convert them to structured date-time data.

**Interface**:
```typescript
interface TemporalExpression {
  startDate: Date;
  endDate?: Date;
  confidence: number;
  originalText: string;
  position: { start: number; end: number };
}

interface NLPParser {
  parse(text: string, referenceDate: Date): TemporalExpression[];
  registerPattern(pattern: RegExp, handler: PatternHandler): void;
}
```

**Implementation Notes**:
- Use a library like `chrono-node` for JavaScript/TypeScript or `dateparser` for Python to handle common temporal patterns
- Support both absolute dates (e.g., "January 15, 2025") and relative dates (e.g., "tomorrow", "next week")
- Return confidence scores to handle ambiguous cases
- Track position in original text for context extraction

### Meeting Extractor

**Responsibility**: Extract meeting metadata (title, participants, location, duration) from message context.

**Interface**:
```typescript
interface MeetingDetails {
  title: string;
  participants: string[];
  location?: string;
  duration?: number; // in minutes
}

interface MeetingExtractor {
  extract(message: string, temporal: TemporalExpression): MeetingDetails;
}
```

**Implementation Notes**:
- Extract title from text surrounding the temporal expression
- Use heuristics to identify participant names (e.g., "@mentions", "with X and Y")
- Detect location keywords (e.g., "at", "in", URLs for video calls)
- Parse duration expressions (e.g., "for 30 minutes", "1 hour meeting")
- Default to 1-hour duration if not specified

### Validator

**Responsibility**: Validate extracted meeting information and handle edge cases.

**Interface**:
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface Validator {
  validate(temporal: TemporalExpression, details: MeetingDetails): ValidationResult;
}
```

**Implementation Notes**:
- Reject impossible dates (e.g., February 30th)
- Warn about past dates
- Validate that end time is after start time
- Check for reasonable duration limits (e.g., < 24 hours)
- Ensure required fields (title, start time) are present

### Duplicate Detector

**Responsibility**: Check for existing calendar events that might be duplicates.

**Interface**:
```typescript
interface DuplicateCheck {
  isDuplicate: boolean;
  similarEvents: CalendarEvent[];
}

interface DuplicateDetector {
  check(event: CalendarEvent, timeWindow: number): Promise<DuplicateCheck>;
}
```

**Implementation Notes**:
- Query calendar API for events within ±15 minutes of proposed time
- Compare titles using fuzzy matching (e.g., Levenshtein distance)
- Consider events with >80% title similarity as potential duplicates

### Calendar API Client

**Responsibility**: Interface with external calendar services to create and query events.

**Interface**:
```typescript
interface CalendarEvent {
  id?: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  participants?: string[];
  description?: string;
}

interface CalendarAPIClient {
  createEvent(event: CalendarEvent): Promise<CalendarEvent>;
  getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  updateEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent>;
}
```

**Implementation Notes**:
- Support Google Calendar API as primary implementation
- Design interface to support multiple calendar providers (Outlook, Apple Calendar)
- Implement exponential backoff for rate limiting (start with 1s, max 32s)
- Handle authentication and token refresh

### Event Queue

**Responsibility**: Queue failed event creation attempts for retry.

**Interface**:
```typescript
interface QueuedEvent {
  event: CalendarEvent;
  attempts: number;
  nextRetry: Date;
}

interface EventQueue {
  enqueue(event: CalendarEvent): void;
  processQueue(): Promise<void>;
  getQueueStatus(): QueuedEvent[];
}
```

**Implementation Notes**:
- Store queued events in memory or persistent storage
- Retry up to 3 times with exponential backoff
- Remove from queue after successful creation or max attempts

## Data Models

### TemporalExpression
```typescript
{
  startDate: Date,           // Absolute start date/time
  endDate?: Date,            // Optional end date/time
  confidence: number,        // 0.0 to 1.0
  originalText: string,      // Original text that was parsed
  position: {
    start: number,           // Character position in message
    end: number
  }
}
```

### MeetingDetails
```typescript
{
  title: string,             // Meeting title/subject
  participants: string[],    // List of participant identifiers
  location?: string,         // Physical location or URL
  duration?: number          // Duration in minutes
}
```

### CalendarEvent
```typescript
{
  id?: string,               // Unique identifier (from calendar API)
  title: string,             // Event title
  startTime: Date,           // Event start
  endTime: Date,             // Event end
  location?: string,         // Location or meeting link
  participants?: string[],   // Attendee email addresses
  description?: string       // Additional notes
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Temporal expression extraction completeness
*For any* chat message containing temporal expressions, the parser should extract all distinct temporal expressions present in the message, with each extraction containing valid date-time information.
**Validates: Requirements 1.1, 1.2**

### Property 2: Relative date resolution
*For any* temporal expression using relative terms (e.g., "tomorrow", "next week", "in 3 days") and a given reference date, the parser should resolve it to an absolute date that correctly represents the relative offset from the reference date.
**Validates: Requirements 1.3, 4.2**

### Property 3: Temporal parsing format support
*For any* valid temporal expression in supported formats (absolute dates, 12-hour time, 24-hour time, combined date-time), the parser should correctly extract the date and time components regardless of format or ordering.
**Validates: Requirements 1.1, 4.1, 4.3, 4.4, 4.5**

### Property 4: Non-temporal message handling
*For any* message containing no temporal expressions, the system should process it without creating calendar events or throwing errors.
**Validates: Requirements 1.5**

### Property 5: Ambiguous time default resolution
*For any* ambiguous time reference (e.g., "3" without AM/PM), the parser should apply a reasonable default that falls within typical business hours (9 AM - 6 PM).
**Validates: Requirements 1.4**

### Property 6: Meeting detail extraction
*For any* message containing a temporal expression, the meeting extractor should extract at least a title, and when participant mentions, locations, or duration indicators are present, those should also be captured.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 7: Duration calculation
*For any* message indicating a meeting duration, the calculated end time should equal the start time plus the specified duration.
**Validates: Requirements 2.4**

### Property 8: Complete data propagation to API
*For any* extracted meeting information (title, start time, end time, location, participants), when creating a calendar event, all extracted fields should be included in the API request.
**Validates: Requirements 3.1, 3.2**

### Property 9: Retry with exponential backoff
*For any* API rate limit error, the system should retry the request with exponentially increasing delays (1s, 2s, 4s, etc.) up to a maximum delay.
**Validates: Requirements 3.5**

### Property 10: Duplicate detection time window
*For any* proposed calendar event, the duplicate checker should only consider existing events within ±15 minutes of the proposed start time as potential duplicates.
**Validates: Requirements 5.1, 5.4**

### Property 11: Conflict resolution strategy
*For any* message containing conflicting temporal information (e.g., "tomorrow at 3pm... actually make it 4pm"), the parser should use the most recently mentioned or most specific temporal expression.
**Validates: Requirements 6.4**

### Property 12: Error information completeness
*For any* parsing failure or processing error, the system should return or log detailed information including the error type, the problematic input, and the reason for failure.
**Validates: Requirements 6.5, 7.3**

### Property 13: Parser output structure
*For any* successful parse operation, the returned temporal expression should contain all required fields: startDate, confidence score, originalText, and position information.
**Validates: Requirements 7.1**

### Property 14: Date-time validation
*For any* extracted temporal information, the system should validate that dates are possible (e.g., no February 30th) and that end times occur after start times.
**Validates: Requirements 7.4**

## Error Handling

### Parsing Errors
- **Invalid dates**: Return validation error with specific reason (e.g., "February 30th is not a valid date")
- **Ambiguous expressions**: Apply defaults and include warning in response
- **Unparseable text**: Return empty result with confidence score of 0.0

### API Errors
- **Rate limiting**: Implement exponential backoff (1s, 2s, 4s, 8s, 16s, 32s max)
- **Authentication failures**: Refresh tokens automatically, notify user if refresh fails
- **Network errors**: Queue event for retry, notify user of temporary failure
- **Validation errors**: Log full error response and notify user with actionable message

### Data Validation Errors
- **Missing required fields**: Return validation error listing missing fields
- **Past dates**: Warn user and request confirmation before creating event
- **Impossible dates**: Reject with specific error message
- **Duration limits**: Warn if duration exceeds 12 hours

### Duplicate Detection
- **Exact duplicates**: Skip creation, notify user that event already exists
- **Similar events**: Create event but warn user about potential duplicate
- **API query failures**: Proceed with creation but log warning

## Testing Strategy

### Unit Testing

Unit tests will verify specific behaviors and edge cases:

- **Temporal pattern matching**: Test specific date/time formats (e.g., "Jan 15", "3pm", "tomorrow")
- **Edge cases**: Empty messages, invalid dates (Feb 30), past dates, very long durations
- **Error conditions**: API failures, network timeouts, invalid authentication
- **Default values**: Missing duration defaults to 1 hour, ambiguous times default to business hours
- **Boundary conditions**: Events at midnight, dates at year boundaries, leap years

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using a library like `fast-check` (JavaScript/TypeScript) or `Hypothesis` (Python):

- **Minimum 100 iterations** per property test to ensure thorough coverage
- Each property test will be tagged with a comment referencing the design document property
- Tag format: `// Feature: chat-meeting-scheduler, Property X: [property description]`

Property tests will cover:

1. **Parsing correctness**: Generate random temporal expressions and verify valid date-time extraction
2. **Relative date resolution**: Generate random relative expressions and reference dates, verify correct offset calculation
3. **Format handling**: Generate dates/times in various formats, verify consistent parsing
4. **Extraction completeness**: Generate messages with varying numbers of temporal expressions, verify all are found
5. **Data propagation**: Generate random meeting details, verify all fields reach the API
6. **Duplicate detection**: Generate random events and time windows, verify correct duplicate identification
7. **Error handling**: Generate invalid inputs, verify appropriate error responses
8. **Validation**: Generate random temporal data, verify validation catches impossible dates

### Integration Testing

Integration tests will verify end-to-end workflows:

- Message input → parsing → extraction → validation → API call → event creation
- Duplicate detection with real calendar queries
- Retry logic with simulated API failures
- Queue processing for failed events

### Test Data Generation

For property-based testing, generators will produce:

- **Temporal expressions**: Various date formats, time formats, relative expressions
- **Chat messages**: Messages with 0-5 temporal expressions, with/without context
- **Meeting details**: Random titles, participant lists, locations, durations
- **Edge cases**: Invalid dates, past dates, ambiguous times, conflicting information
- **API responses**: Success, rate limits, errors, timeouts

## Implementation Notes

### Technology Recommendations

**For JavaScript/TypeScript**:
- NLP parsing: `chrono-node` (mature temporal expression parser)
- Calendar API: `googleapis` for Google Calendar
- Property testing: `fast-check`
- Unit testing: `vitest` or `jest`

**For Python**:
- NLP parsing: `dateparser` or `dateutil`
- Calendar API: `google-api-python-client`
- Property testing: `hypothesis`
- Unit testing: `pytest`

### Performance Considerations

- Cache parsed temporal patterns to avoid re-parsing common expressions
- Batch calendar API queries when checking for duplicates
- Implement request throttling to stay within API rate limits
- Use connection pooling for API clients

### Security Considerations

- Validate and sanitize all user input before processing
- Store API credentials securely (environment variables, secret management)
- Implement proper OAuth2 flow for calendar access
- Log security-relevant events (authentication failures, unauthorized access attempts)
- Never log sensitive data (tokens, passwords, personal information)

### Extensibility

- Design parser to support pluggable pattern handlers for new temporal expressions
- Abstract calendar API interface to support multiple providers (Google, Outlook, Apple)
- Allow configuration of default values (duration, time resolution, duplicate window)
- Support custom extraction rules for domain-specific meeting patterns
