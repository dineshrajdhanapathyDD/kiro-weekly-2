export class Validator {
  validate(temporal, details) {
    const errors = [];
    const warnings = [];
    
    // Check required fields
    if (!details.title || details.title.trim().length === 0) {
      errors.push('Meeting title is required');
    }
    
    if (!temporal.startDate) {
      errors.push('Start date is required');
    }
    
    // Check for past dates
    const now = new Date();
    if (temporal.startDate < now) {
      warnings.push('Meeting is scheduled in the past');
    }
    
    // Calculate end time
    const endDate = temporal.endDate || new Date(temporal.startDate.getTime() + details.duration * 60000);
    
    // Validate end time is after start time
    if (endDate <= temporal.startDate) {
      errors.push('End time must be after start time');
    }
    
    // Check duration limits
    const durationHours = (endDate - temporal.startDate) / (1000 * 60 * 60);
    if (durationHours > 24) {
      warnings.push('Meeting duration exceeds 24 hours');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
