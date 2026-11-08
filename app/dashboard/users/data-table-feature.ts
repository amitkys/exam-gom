import { tableFeatures } from "@tanstack/react-table";

// Filtering and pagination happen on the server, before rows reach this table.
export const userTableFeatures = tableFeatures({});
export type UserTableFeatures = typeof userTableFeatures;
