# Implementation Plan

- [x] 1. Set up project structure and dependencies


  - Create directory structure for parser, extractor, validator, and API client components
  - Install core dependencies: NLP library (chrono-node or dateparser), calendar API client, testing frameworks
  - Configure TypeScript/Python project with proper module structure
  - Set up testing framework (fast-check/hypothesis for property tests, vitest/pytest for unit tests)
  - _Requirements: 7.1, 7.2_

- [x] 2. Implement NLP temporal parser


  - Create TemporalExpression interface/class with required fields (startDate, endDate, confidence, originalText, position)
  - Implement NLPParser class using chosen library (chrono-node or dateparser)
  - Add support for absolute date parsing (e.g., "January 15th", "12/25/2025")
  - Add support for relative date parsing (e.g., "tomorrow", "next week", "in 3 days")
  - Add support for 12-hour and 24-hour time formats
  - Implement confidence scoring for parsed expressions
  - Handle multiple temporal expressions in a single message
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 2.1 Write property test for temporal expression extraction
  - **Property 1: Temporal expression extraction completeness**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 2.2 Write property test for relative date resolution
  - **Property 2: Relative date resolution**
  - **Validates: Requirements 1.3, 4.2**

- [ ]* 2.3 Write property test for format support
  - **Property 3: Temporal parsing format support**
  - **Validates: Requirements 1.1, 4.1, 4.3, 4.4, 4.5**

- [ ]* 2.4 Write property test for parser output structure
  - **Property 13: Parser output structure**
  - **Validates: Requirements 7.1**

- [x] 3. Implement ambiguous time handling and defaults


  - Add logic to detect ambiguous time references (e.g., "3" without AM/PM)
  - Implement default resolution to business hours (9 AM - 6 PM)
  - Set default meeting duration to 1 hour when not specified
  - _Requirements: 1.4, 2.5_

- [ ]* 3.1 Write property test for ambiguous time defaults
  - **Property 5: Ambiguous time default resolution**
  - **Validates: Requirements 1.4**

- [x] 4. Implement meeting detail extractor


  - Create MeetingDetails interface/class with title, participants, location, duration fields
  - Implement MeetingExtractor class to analyze message context
  - Extract meeting title from text surrounding temporal expressions
  - Detect and extract participant mentions (e.g., "@username", "with X and Y")
  - Detect and extract location information (keywords like "at", "in", URLs)
  - Parse duration expressions (e.g., "for 30 minutes", "1 hour meeting")
  - Calculate end time based on start time and duration
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 4.1 Write property test for meeting detail extraction
  - **Property 6: Meeting detail extraction**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ]* 4.2 Write property test for duration calculation
  - **Property 7: Duration calculation**
  - **Validates: Requirements 2.4**

- [x] 5. Implement validator component


  - Create ValidationResult interface with isValid, errors, warnings fields
  - Implement Validator class to check extracted data
  - Validate dates are possible (reject February 30th, etc.)
  - Validate end time is after start time
  - Check for reasonable duration limits (< 24 hours)
  - Detect and warn about past dates
  - Ensure required fields (title, start time) are present
  - _Requirements: 6.1, 6.2, 7.4_

- [ ]* 5.1 Write property test for date-time validation
  - **Property 14: Date-time validation**
  - **Validates: Requirements 7.4**

- [ ]* 5.2 Write unit tests for edge cases
  - Test invalid dates (February 30th)
  - Test past dates
  - Test missing required fields
  - Test duration limits

- [x] 6. Implement calendar API client


  - Create CalendarEvent interface with id, title, startTime, endTime, location, participants fields
  - Implement CalendarAPIClient interface with createEvent, getEvents, updateEvent methods
  - Set up Google Calendar API authentication (OAuth2)
  - Implement createEvent method to send events to calendar API
  - Implement getEvents method to query existing events
  - Handle API authentication and token refresh
  - _Requirements: 3.1, 3.2_

- [ ]* 6.1 Write property test for data propagation
  - **Property 8: Complete data propagation to API**
  - **Validates: Requirements 3.1, 3.2**

- [ ]* 6.2 Write unit tests for API success and error responses
  - Test successful event creation
  - Test API error handling
  - _Requirements: 3.3, 3.4_

- [ ] 7. Implement error handling and retry logic
  - Add exponential backoff for API rate limiting (1s, 2s, 4s, 8s, 16s, 32s max)
  - Implement retry mechanism with maximum 3 attempts
  - Add detailed error logging for all failure types
  - Handle network errors gracefully
  - Return detailed error information for parsing failures
  - _Requirements: 3.4, 3.5, 6.5, 7.3_

- [ ]* 7.1 Write property test for exponential backoff
  - **Property 9: Retry with exponential backoff**
  - **Validates: Requirements 3.5**

- [ ]* 7.2 Write property test for error information completeness
  - **Property 12: Error information completeness**
  - **Validates: Requirements 6.5, 7.3**

- [ ] 8. Implement duplicate detection
  - Create DuplicateCheck interface with isDuplicate and similarEvents fields
  - Implement DuplicateDetector class
  - Query calendar API for events within ±15 minutes of proposed time
  - Implement fuzzy title matching (e.g., Levenshtein distance)
  - Consider events with >80% title similarity as potential duplicates
  - Skip creation for exact duplicates
  - Warn user about similar events
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 8.1 Write property test for duplicate detection time window
  - **Property 10: Duplicate detection time window**
  - **Validates: Requirements 5.1, 5.4**

- [ ]* 8.2 Write unit tests for duplicate scenarios
  - Test exact duplicate detection
  - Test similar event detection
  - _Requirements: 5.2, 5.3_

- [ ] 9. Implement event queue for failed requests
  - Create QueuedEvent interface with event, attempts, nextRetry fields
  - Implement EventQueue class with enqueue, processQueue, getQueueStatus methods
  - Store queued events (in-memory or persistent storage)
  - Implement queue processing with retry logic
  - Remove events after successful creation or max attempts
  - Notify user when events are queued
  - _Requirements: 6.3_

- [ ]* 9.1 Write unit tests for queue operations
  - Test event queueing
  - Test queue processing
  - Test retry logic
  - _Requirements: 6.3_

- [ ] 10. Implement conflict resolution
  - Add logic to detect conflicting temporal information in messages
  - Implement strategy to use most recent or most specific temporal expression
  - Handle cases where multiple times are mentioned
  - _Requirements: 6.4_

- [ ]* 10.1 Write property test for conflict resolution
  - **Property 11: Conflict resolution strategy**
  - **Validates: Requirements 6.4**

- [x] 11. Implement main orchestration pipeline



  - Create main function that coordinates all components
  - Wire together: message input → parser → extractor → validator → duplicate check → API client
  - Handle non-temporal messages gracefully (no event creation)
  - Return appropriate responses for success, warnings, and errors
  - Add user notifications for event creation, duplicates, and failures
  - _Requirements: 1.5, 3.3, 3.4_

- [ ]* 11.1 Write property test for non-temporal message handling
  - **Property 4: Non-temporal message handling**
  - **Validates: Requirements 1.5**

- [ ]* 11.2 Write integration tests for end-to-end workflows
  - Test complete pipeline from message to event creation
  - Test duplicate detection with calendar queries
  - Test retry logic with simulated failures

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
