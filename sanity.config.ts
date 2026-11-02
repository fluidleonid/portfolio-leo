import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schema } from "./src/sanity/schemaTypes";
import { projectId, dataset } from "./src/sanity/env";

export default defineConfig({
  basePath: "/studio",
  name: "portfolio_studio",
  title: "Portfolio CMS Studio",
  projectId,
  dataset,
  schema,
  plugins: [structureTool()],
});
