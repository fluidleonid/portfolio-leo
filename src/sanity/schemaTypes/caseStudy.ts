import { defineType, defineField, defineArrayMember } from "sanity";

export const caseStudyType = defineType({
  name: "caseStudy",
  title: "Case Study",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Case Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "projectTag",
      title: "Project / Product Tag (e.g. Orkestra, Scorpex, Quidzi, Dangdi)",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline / One-liner Pitch",
      type: "string",
    }),
    defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "blocks",
      title: "Page Blocks (Modular Layout Engine)",
      type: "array",
      of: [
        // 1. 2-Column Metadata Table
        defineArrayMember({
          name: "metadataTable",
          title: "Metadata Table (Client / Role / Team / Delivered / etc.)",
          type: "object",
          fields: [
            defineField({
              name: "rows",
              title: "Rows",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  fields: [
                    defineField({ name: "label", title: "Label", type: "string" }),
                    defineField({ name: "value", title: "Value", type: "string" }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // 2. Section Heading
        defineArrayMember({
          name: "sectionHeading",
          title: "Section Heading",
          type: "object",
          fields: [
            defineField({ name: "badge", title: "Hardware Badge (e.g. OVERVIEW, DESIGN)", type: "string" }),
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({ name: "description", title: "Description", type: "text" }),
          ],
        }),

        // 3. Problem List
        defineArrayMember({
          name: "problemList",
          title: "Key Problems",
          type: "object",
          fields: [
            defineField({ name: "badge", title: "Badge", type: "string", initialValue: "PROBLEMS" }),
            defineField({ name: "title", title: "Section Title", type: "string" }),
            defineField({
              name: "items",
              title: "Problems",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  fields: [
                    defineField({ name: "title", title: "Problem Title", type: "string" }),
                    defineField({ name: "description", title: "Problem Description", type: "text" }),
                    defineField({ name: "metric", title: "Negative Impact / Metric", type: "string" }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // 4. Team Section
        defineArrayMember({
          name: "teamSection",
          title: "Team & Composition",
          type: "object",
          fields: [
            defineField({ name: "badge", title: "Badge", type: "string", initialValue: "TEAM" }),
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({
              name: "composition",
              title: "Team Composition",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  fields: [
                    defineField({ name: "role", title: "Role", type: "string" }),
                    defineField({ name: "name", title: "Name / Size", type: "string" }),
                    defineField({ name: "details", title: "Details", type: "string" }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // 5. Discovery Section
        defineArrayMember({
          name: "discoverySection",
          title: "Discovery & User Research",
          type: "object",
          fields: [
            defineField({ name: "badge", title: "Badge", type: "string", initialValue: "DISCOVERY" }),
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({ name: "method", title: "Research Method (e.g. Mouseflow, Ops Interviews)", type: "string" }),
            defineField({
              name: "findings",
              title: "Key Findings",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  fields: [
                    defineField({ name: "title", title: "Finding Title", type: "string" }),
                    defineField({ name: "description", title: "Finding Description", type: "text" }),
                    defineField({ name: "stat", title: "Statistic / Percentage", type: "string" }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // 6. Hypotheses Section
        defineArrayMember({
          name: "hypothesesSection",
          title: "Hypotheses & Architecture",
          type: "object",
          fields: [
            defineField({ name: "badge", title: "Badge", type: "string", initialValue: "HYPOTHESES" }),
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({
              name: "items",
              title: "Hypotheses",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  fields: [
                    defineField({ name: "title", title: "Hypothesis", type: "string" }),
                    defineField({ name: "description", title: "Rationale / Implementation", type: "text" }),
                    defineField({ name: "expectedOutcome", title: "Expected Outcome", type: "string" }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // 7. Horizontal Breakout Gallery
        defineArrayMember({
          name: "galleryBlock",
          title: "Horizontal Gallery (Full Bleed Breakout)",
          type: "object",
          fields: [
            defineField({
              name: "images",
              title: "Images",
              type: "array",
              of: [{ type: "image" }],
            }),
            defineField({ name: "height", title: "Height (px)", type: "number", initialValue: 600 }),
            defineField({ name: "caption", title: "Caption", type: "string" }),
          ],
        }),

        // 8. Results & Metrics
        defineArrayMember({
          name: "metricsBlock",
          title: "Results & Impact Metrics",
          type: "object",
          fields: [
            defineField({ name: "badge", title: "Badge", type: "string", initialValue: "RESULTS" }),
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({
              name: "items",
              title: "Metrics",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  fields: [
                    defineField({ name: "value", title: "Impact Value (e.g. 70% Faster, 2.5x, 30s)", type: "string" }),
                    defineField({ name: "label", title: "Metric Label", type: "string" }),
                    defineField({ name: "description", title: "Context / Proof", type: "text" }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // 9. Plain / Rich Text Block
        defineArrayMember({
          name: "textBlock",
          title: "Text / Story Paragraphs",
          type: "object",
          fields: [
            defineField({ name: "content", title: "Content", type: "text" }),
          ],
        }),

        // 10. Quote Callout
        defineArrayMember({
          name: "quoteCallout",
          title: "Quote / Key Takeaway",
          type: "object",
          fields: [
            defineField({ name: "quote", title: "Quote", type: "text" }),
            defineField({ name: "author", title: "Author", type: "string" }),
            defineField({ name: "role", title: "Role", type: "string" }),
          ],
        }),
      ],
    }),
  ],
});
