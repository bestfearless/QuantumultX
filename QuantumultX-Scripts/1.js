function parse(context) {
    const content = context.content;
    const lines = content.split('\n');
    const uniqueHostnames = new Set();
    const outputLines =;
    let hostnameLineFound = false; // Flag to track if we've processed a hostname line

    // Regex to match 'hostname = ' followed by values, optionally ending with a comment.
    // It captures the hostname list, ignoring leading/trailing spaces and comments.
    const hostnameRegex = /^\s*hostname\s*=\s*([^;]*?)(?:\s*;.*)?$/i;

    for (const line of lines) {
        const match = line.match(hostnameRegex);
        if (match) {
            // Found a hostname line
            hostnameLineFound = true;
            const hostnamesString = match.trim();
            // Split by comma, trim each hostname, and add to the Set
            hostnamesString.split(',').forEach(h => {
                const trimmedHostname = h.trim();
                if (trimmedHostname) { // Ensure no empty strings are added
                    uniqueHostnames.add(trimmedHostname);
                }
            });
            // Do NOT add this original hostname line to outputLines yet,
            // as we will replace all of them with a single merged line later.
        } else {
            // Not a hostname line, add it to the output directly
            outputLines.push(line);
        }
    }

    // If no hostname lines were found, return the original content
    if (!hostnameLineFound) {
        return content;
    }

    // Construct the new merged hostname line
    const mergedHostnames = Array.from(uniqueHostnames).join(', ');
    const newHostnameLine = `hostname = ${mergedHostnames}`;

    // Find the best place to insert the new hostname line.
    // Ideally, it should be in the [general] section or where the first hostname was.
    // For simplicity and robustness, we'll insert it at the beginning of the file
    // or just after the [general] section if it exists.

    let insertIndex = 0;
    let generalSectionFound = false;
    for (let i = 0; i < outputLines.length; i++) {
        if (outputLines[i].trim().toLowerCase() === '[general]') {
            generalSectionFound = true;
            insertIndex = i + 1; // Insert right after [general]
            break;
        }
    }

    // If [general] section was found, insert the new line there.
    // Otherwise, insert at the very beginning of the file.
    outputLines.splice(insertIndex, 0, newHostnameLine);

    // Reconstruct the content
    return outputLines.join('\n');
}
