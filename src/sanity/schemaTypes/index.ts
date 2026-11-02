import { type SchemaTypeDefinition } from "sanity";
import { caseStudyType } from "./caseStudy";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [caseStudyType],
};
