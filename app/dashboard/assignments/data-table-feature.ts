import { tableFeatures } from "@tanstack/react-table";

// Search and pagination are applied by the server, not to the current page's rows.
export const assignmentTableFeatures = tableFeatures({});
export type AssignmentTableFeatures = typeof assignmentTableFeatures;
