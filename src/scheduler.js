import { NLPParser } from './parser.js';
import { MeetingExtractor } from './extractor.js';
import { Validator } from './validator.js';
import { CalendarAPIClient } from './calendar-client.js';

export class ChatMeetingScheduler {
  constructor() {
    this.parser = new NLPParser();
    this.extractor = new MeetingExtractor();
    this.validator = new Validator();
    this.calendarClient = new CalendarAPIClient();
  }
  
  async processMessage(message) {
    console.log('\n📨 Processing message:', message);
    console.log('─'.repeat(60));
    
    // Parse temporal expressions
    const temporals = this.parser.parse(message);
    
    if (temporals.length === 0) {
      console.log('ℹ️  No temporal expressions found - no events created');
      return { success: true, events: [], message: 'No temporal expressions found' };
    }
    
    console.log(`⏰ Found ${temporals.length} temporal expression(s)`);
    
    const results = [];
    
    for (const temporal of temporals) {
      console.log(`\n  Temporal: "${temporal.originalText}"`);
      console.log(`  Start: ${temporal.startDate.toLocaleString()}`);
      
      // Extract meeting details
      const details = this.extractor.extract(message, temporal);
      console.log(`  Title: "${details.title}"`);
      if (details.participants.length > 0) {
        console.log(`  Participants: ${details.participants.join(', ')}`);
      }
      if (details.location) {
        console.log(`  Location: ${details.location}`);
      }
      console.log(`  Duration: ${details.duration} minutes`);
      
      // Validate
      const validation = this.validator.validate(temporal, details);
      
      if (validation.warnings.length > 0) {
        console.log(`  ⚠️  Warnings: ${validation.warnings.join(', ')}`);
      }
      
      if (!validation.isValid) {
        console.log(`  ❌ Validation failed: ${validation.errors.join(', ')}`);
        results.push({ success: false, errors: validation.errors });
        continue;
      }
      
      // Create calendar event
      const endTime = temporal.endDate || new Date(temporal.startDate.getTime() + details.duration * 60000);
      
      const event = {
        title: details.title,
        startTime: temporal.startDate,
        endTime: endTime,
        location: details.location,
        participants: details.participants
      };
      
      try {
        const createdEvent = await this.calendarClient.createEvent(event);
        results.push({ success: true, event: createdEvent });
      } catch (error) {
        console.log(`  ❌ Failed to create event: ${error.message}`);
        results.push({ success: false, errors: [error.message] });
      }
    }
    
    console.log('─'.repeat(60));
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Created ${successCount} of ${temporals.length} event(s)\n`);
    
    return { success: true, results };
  }
}
