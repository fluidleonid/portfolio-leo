import { type SchemaTypeDefinition } from "sanity";
import { caseStudyType } from "./caseStudy";
import { projectType } from "./project";
import { siteSettingsType } from "./siteSettings";
import { petProjectType } from "./petProject";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [projectType, caseStudyType, petProjectType, siteSettingsType],
};
