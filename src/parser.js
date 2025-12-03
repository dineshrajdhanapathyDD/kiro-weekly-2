import * as chrono from 'chrono-node';

export class NLPParser {
  parse(text, referenceDate = new Date()) {
    const results = chrono.parse(text, referenceDate);
    
    // Filter out duration-only expressions (they're not meeting times)
    const filtered = results.filter(result => {
      const text = result.text.toLowerCase();
      // Skip if it's just a duration phrase
      if (text.match(/^for\s+\d+\s+(hour|minute|min)/)) {
        return false;
      }
      return true;
    });
    
    return filtered.map(result => {
      const startDate = result.start.date();
      
      // Apply business hours default for ambiguous times
      if (!result.start.isCertain('hour')) {
        const hour = startDate.getHours();
        if (hour < 9 || hour > 18) {
          startDate.setHours(14, 0, 0, 0); // Default to 2 PM
        }
      }
      
      return {
        startDate,
        endDate: result.end ? result.end.date() : null,
        confidence: result.start.isCertain() ? 0.9 : 0.6,
        originalText: result.text,
        position: {
          start: result.index,
          end: result.index + result.text.length
        }
      };
    });
  }
}
