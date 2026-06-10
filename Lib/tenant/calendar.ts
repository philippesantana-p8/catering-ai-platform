import type { Branch, Company } from './types'

export type CalendarTarget = {
  calendarId: string | null
  timezone: string
  source: 'branch' | 'company' | 'none'
}

/**
 * Resolve Google Calendar for a quote/event:
 * 1) branch calendar if enabled
 * 2) company calendar if enabled
 */
export function resolveCalendarTarget(input: {
  company?: Company | null
  branch?: Branch | null
}): CalendarTarget {
  const branch = input.branch
  const company = input.company

  if (branch?.google_calendar_enabled && branch.google_calendar_id?.trim()) {
    return {
      calendarId: branch.google_calendar_id.trim(),
      timezone:
        branch.timezone?.trim() ||
        company?.google_calendar_timezone?.trim() ||
        company?.default_timezone?.trim() ||
        'America/New_York',
      source: 'branch',
    }
  }

  if (company?.google_calendar_enabled && company.google_calendar_id?.trim()) {
    return {
      calendarId: company.google_calendar_id.trim(),
      timezone:
        company.google_calendar_timezone?.trim() ||
        company.default_timezone?.trim() ||
        'America/New_York',
      source: 'company',
    }
  }

  return {
    calendarId: null,
    timezone:
      company?.default_timezone?.trim() || 'America/New_York',
    source: 'none',
  }
}
