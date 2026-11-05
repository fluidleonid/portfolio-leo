import { defineType, defineField, defineArrayMember } from "sanity";

export const projectDocumentType = defineType({
  name: "project",
  title: "Main Page Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Project Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "anchorId",
      title: "Tuner Anchor ID",
      type: "string",
      description:
        "Anchor ID used for radio tuner navigation (e.g. works, project-2, project-3, project-4, project-5, project-6)",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Order on the main page (1, 2, 3...)",
      initialValue: 1,
    }),
    defineField({
      name: "projectType",
      title: "Project Type (B2B / B2C)",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: {
        list: [
          { title: "B2B (Business-to-Business)", value: "B2B" },
          { title: "B2C (Business-to-Consumer)", value: "B2C" },
        ],
      },
      description: "Tags used for filtering (select B2B, B2C, or both)",
      initialValue: ["B2B"],
      validation: (Rule) =>
        Rule.required().min(1).error("Select at least one type: B2B or B2C"),
    }),
    defineField({
      name: "description",
      title: "Project Description / Pitch",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "images",
      title: "Horizontal Gallery Images",
      type: "array",
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
              title: "Path or URL (e.g. /quickaccess.png)",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { title: "url" },
          },
        }),
      ],
    }),
    defineField({
      name: "keyAchievements",
      title: "Key Achievements (Left 'KEY' Section)",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
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
      subtitle: "anchorId",
      order: "order",
      projectType: "projectType",
    },
    prepare({ title, subtitle, order, projectType }) {
      const types = Array.isArray(projectType)
        ? projectType.join(" / ")
        : projectType || "";
      return {
        title: `${order ? `#${order} ` : ""}${title}${types ? ` · [${types}]` : ""}`,
        subtitle: `Anchor: #${subtitle}`,
      };
    },
  },
});

export const projectType = projectDocumentType;
