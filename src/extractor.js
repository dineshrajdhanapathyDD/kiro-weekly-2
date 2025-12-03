export class MeetingExtractor {
  extract(message, temporal) {
    const title = this.extractTitle(message, temporal);
    const participants = this.extractParticipants(message);
    const location = this.extractLocation(message);
    const duration = this.extractDuration(message);
    
    return { title, participants, location, duration };
  }
  
  extractTitle(message, temporal) {
    // Extract text before the temporal expression as title
    const beforeText = message.substring(0, temporal.position.start).trim();
    const afterText = message.substring(temporal.position.end).trim();
    
    // Prefer text before, fallback to after, or use temporal text
    if (beforeText.length > 0) {
      return beforeText.split('\n')[0].substring(0, 100);
    } else if (afterText.length > 0) {
      return afterText.split('\n')[0].substring(0, 100);
    }
    return temporal.originalText;
  }
  
  extractParticipants(message) {
    const participants = [];
    const withPattern = /with\s+([A-Z][a-z]+(?:\s+and\s+[A-Z][a-z]+)*)/gi;
    const matches = message.matchAll(withPattern);
    
    for (const match of matches) {
      const names = match[1].split(/\s+and\s+/i);
      participants.push(...names);
    }
    
    // Also check for @mentions
    const mentionPattern = /@(\w+)/g;
    const mentions = message.matchAll(mentionPattern);
    for (const mention of mentions) {
      participants.push(mention[1]);
    }
    
    return participants;
  }
  
  extractLocation(message) {
    // Look for location keywords
    const atPattern = /\bat\s+([^,.\n]+)/i;
    const inPattern = /\bin\s+([^,.\n]+)/i;
    const urlPattern = /(https?:\/\/[^\s]+)/i;
    
    const atMatch = message.match(atPattern);
    if (atMatch) return atMatch[1].trim();
    
    const inMatch = message.match(inPattern);
    if (inMatch) return inMatch[1].trim();
    
    const urlMatch = message.match(urlPattern);
    if (urlMatch) return urlMatch[1];
    
    return null;
  }
  
  extractDuration(message) {
    // Look for duration patterns
    const patterns = [
      /(\d+)\s*hours?/i,
      /(\d+)\s*mins?/i,
      /(\d+)\s*minutes?/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        const value = parseInt(match[1]);
        if (pattern.source.includes('hour')) {
          return value * 60;
        }
        return value;
      }
    }
    
    return 60; // Default 1 hour
  }
}
