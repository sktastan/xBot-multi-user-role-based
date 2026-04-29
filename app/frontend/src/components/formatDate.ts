//===========================================================
//  
//  formatDate.ts
//  Utility for date and time string localization.
//  
//============================================================

/**
 * Formats an ISO date string into a localized, human-readable format.
 */
// ---------------------------------------------------------------------
//   Converts an ISO timestamp into a localized format.
// -------------------------------------------------------------------
export const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(navigator.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};