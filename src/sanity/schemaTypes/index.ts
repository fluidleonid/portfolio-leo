import { type SchemaTypeDefinition } from "sanity";
import { caseStudyType } from "./caseStudy";
import { projectType } from "./project";
import { siteSettingsType } from "./siteSettings";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [projectType, caseStudyType, siteSettingsType],
};
