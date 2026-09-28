/** How a saved profile relates to the account holder. */
export const RELATIONS = ["Self", "Spouse", "Child", "Parent", "Sibling", "Friend", "Other"] as const;
export type Relation = (typeof RELATIONS)[number];
