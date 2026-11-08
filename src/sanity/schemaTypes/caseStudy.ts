import { defineType, defineField, defineArrayMember } from "sanity";
import { MultipleImageUploadInput } from "../components/MultipleImageUploadInput";

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
      name: "project",
      title: "Target Project (Проект, в котором появится кнопка)",
      type: "reference",
      to: [{ type: "project" }],
      description:
        "Проект на главной странице, внутри которого появится кнопка для перехода в этот кейс.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Display Order (Порядок кнопки в проекте)",
      type: "number",
      description:
        "Порядковый номер кнопки внутри блока проекта (1 — первая кнопка, 2 — вторая и т.д.)",
      initialValue: 1,
    }),
    defineField({
      name: "buttonLabel",
      title: "Button Label (Опциональный текст кнопки)",
      type: "string",
      description:
        "Оставьте пустым, чтобы название кнопки бралось автоматически из заголовка кейса.",
    }),
    defineField({
      name: "isButtonActive",
      title: "Кнопка включена (Статус индикатора)",
      type: "boolean",
      initialValue: true,
      description:
        "Включена ли кнопка на главной странице (зеленая лампа горит и ссылка активна).",
    }),
    defineField({
      name: "externalUrl",
      title: "External URL (Опционально)",
      type: "url",
      description:
        "Если заполнено, кнопка на главной странице ведет на внешнюю ссылку (например Framer/Figma), а не на /case/[slug].",
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
              description:
                "Изображения галереи кейса. Можно загружать сразу несколько файлов через кнопку или Drag & Drop.",
              options: {
                layout: "grid",
              },
              components: {
                input: MultipleImageUploadInput,
              },
              of: [
                defineArrayMember({
                  type: "image",
                  options: { hotspot: true },
                }),
                defineArrayMember({
                  type: "object",
                  name: "imagePath",
                  title: "Custom Image Path / URL",
                  fields: [
                    defineField({
                      name: "url",
                      title: "Path or URL",
                      type: "string",
                      validation: (Rule) => Rule.required(),
                    }),
                  ],
                }),
              ],
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
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      order: "order",
      projectName: "project.title",
      buttonLabel: "buttonLabel",
      isButtonActive: "isButtonActive",
      media: "coverImage",
    },
    prepare({ title, order, projectName, buttonLabel, isButtonActive, media }) {
      const status = isButtonActive !== false ? "🟢 ON" : "⚪ OFF";
      const btn = buttonLabel ? ` [Btn: ${buttonLabel}]` : "";
      const orderPrefix = order ? `#${order} ` : "";
      return {
        title: `${orderPrefix}${title}`,
        subtitle: `Project: ${projectName || "Unassigned"}${btn} · ${status}`,
        media,
      };
    },
  },
});
