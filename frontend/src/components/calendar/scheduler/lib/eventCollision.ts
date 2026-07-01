import { CalendarEvent } from '../types';

export interface PositionedEvent {
  event: CalendarEvent;
  column: number;
  totalColumns: number;
}

/**
 * Groups overlapping events together
 * Events in the same group all overlap with at least one other event in the group
 */
function groupOverlappingEvents(events: CalendarEvent[]): CalendarEvent[][] {
  if (events.length === 0) return [];

  // Sort by start time, then by end time (longer events first)
  const sorted = [...events].sort((a, b) => {
    const startDiff = new Date(a.start).getTime() - new Date(b.start).getTime();
    if (startDiff !== 0) return startDiff;
    // If same start, put longer events first
    return new Date(b.end).getTime() - new Date(a.end).getTime();
  });

  const groups: CalendarEvent[][] = [];
  let currentGroup: CalendarEvent[] = [sorted[0]];
  let groupEnd = new Date(sorted[0].end).getTime();

  for (let i = 1; i < sorted.length; i++) {
    const event = sorted[i];
    const eventStart = new Date(event.start).getTime();
    const eventEnd = new Date(event.end).getTime();

    // Check if this event overlaps with any event in the current group
    const overlapsWithGroup = eventStart < groupEnd;

    if (overlapsWithGroup) {
      currentGroup.push(event);
      // Extend group end if this event ends later
      groupEnd = Math.max(groupEnd, eventEnd);
    } else {
      // Start a new group
      groups.push(currentGroup);
      currentGroup = [event];
      groupEnd = eventEnd;
    }
  }

  // Don't forget the last group
  groups.push(currentGroup);

  return groups;
}

/**
 * Assigns columns to events within a group using a greedy algorithm
 * Returns events with their column position and total columns in their collision group
 */
function assignColumns(group: CalendarEvent[]): PositionedEvent[] {
  if (group.length === 0) return [];
  if (group.length === 1) {
    return [{ event: group[0], column: 0, totalColumns: 1 }];
  }

  // Track which columns are occupied at each point
  // Each column tracks the end time of its current event
  const columns: number[] = [];
  const result: PositionedEvent[] = [];

  // Sort by start time
  const sorted = [...group].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  for (const event of sorted) {
    const eventStart = new Date(event.start).getTime();

    // Find the first available column
    let assignedColumn = -1;
    for (let col = 0; col < columns.length; col++) {
      if (columns[col] <= eventStart) {
        assignedColumn = col;
        break;
      }
    }

    // If no column is available, create a new one
    if (assignedColumn === -1) {
      assignedColumn = columns.length;
      columns.push(0);
    }

    // Update the column's end time
    columns[assignedColumn] = new Date(event.end).getTime();

    result.push({
      event,
      column: assignedColumn,
      totalColumns: 0, // Will be set after we know the max columns
    });
  }

  // Now we need to calculate the actual number of columns for each event
  // Events should expand to fill available space
  const maxColumns = columns.length;

  // For each event, find how many columns it can span
  for (const positioned of result) {
    positioned.totalColumns = maxColumns;
  }

  return result;
}

/**
 * Calculates position and width for events that may overlap
 * Returns events with their column index and total columns for layout calculation
 */
export function calculateEventPositions(events: CalendarEvent[]): PositionedEvent[] {
  const groups = groupOverlappingEvents(events);
  const result: PositionedEvent[] = [];

  for (const group of groups) {
    const positioned = assignColumns(group);
    result.push(...positioned);
  }

  return result;
}

/**
 * Helper to calculate CSS properties for a positioned event
 */
export function getEventStyle(positioned: PositionedEvent): {
  left: string;
  width: string;
} {
  const { column, totalColumns } = positioned;
  const width = 100 / totalColumns;
  const left = column * width;

  return {
    left: `${left}%`,
    width: `calc(${width}% - 2px)`, // Small gap between events
  };
}
