import { ChatMeetingScheduler } from './scheduler.js';

const scheduler = new ChatMeetingScheduler();

// Demo messages
const messages = [
  "Team standup tomorrow at 10am for 30 minutes",
  "Let's meet with John and Sarah next Tuesday at 3pm in Conference Room A",
  "Coffee chat on Friday at 2pm https://meet.google.com/abc-defg-hij",
  "This message has no dates or times",
  "Project review December 15th at 9:30 AM for 2 hours"
];

console.log('🚀 Chat Meeting Scheduler Demo');
console.log('═'.repeat(60));

// Process each message
for (const message of messages) {
  await scheduler.processMessage(message);
}

console.log('Demo complete! 🎉');
