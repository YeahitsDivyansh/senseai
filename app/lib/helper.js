// Helper function to convert entries to markdown
export function entriesToMarkdown(entries, type) {
  // If entries array is empty or undefined, return an empty string
  if (!entries?.length) return "";

  return (
    `## ${type}\n\n` + // Add a heading for the section based on the type provided
    entries
      .map((entry) => {
        // Determine the date range format based on whether the entry is current
        const dateRange = entry.current
          ? `${entry.startDate} - Present` // If the entry is ongoing, show "Present"
          : `${entry.startDate} - ${entry.endDate}`; // Otherwise, show the start and end date

        // Format the markdown for each entry with title, organization, date range, and description
        return `### ${entry.title} @ ${entry.organization}\n${dateRange}\n\n${entry.description}`;
      })
      .join("\n\n") // Join all entries with two new lines for proper markdown formatting
  );
}
