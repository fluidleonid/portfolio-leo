import { defineType, defineField, defineArrayMember } from "sanity";

export const projectType = defineType({
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
      name: "description",
      title: "Project Description / Pitch",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "roleDescription",
      title: "Role Description (Optional)",
      type: "string",
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
    defineField({
      name: "caseStudies",
      title: "Case Studies (Right 'CASE' Section)",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "caseLink",
          title: "Case Study Link",
          fields: [
            defineField({
              name: "label",
              title: "Button Label",
              type: "string",
              description: "Text shown on the button (e.g. Zero-Code Ribbon Builder)",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "caseStudy",
              title: "Linked Sanity Case Study",
              type: "reference",
              to: [{ type: "caseStudy" }],
              description: "Select a Case Study document to automatically link to /case/[slug]",
            }),
            defineField({
              name: "externalUrl",
              title: "External URL (if not a Sanity case)",
              type: "url",
              description: "E.g. Framer, Figma, or prototype link",
            }),
            defineField({
              name: "active",
              title: "Indicator Lamp Active",
              type: "boolean",
              description: "Turn on (amber glow) or dim the indicator lamp",
              initialValue: true,
            }),
          ],
          preview: {
            select: {
              title: "label",
              caseTitle: "caseStudy.title",
              active: "active",
            },
            prepare({ title, caseTitle, active }) {
              return {
                title: title || caseTitle,
                subtitle: caseTitle
                  ? `Linked to: ${caseTitle} (${active ? "Lamp ON" : "Dim"})`
                  : `Custom link (${active ? "Lamp ON" : "Dim"})`,
              };
            },
          },
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
      subtitle: "anchorId",
      order: "order",
    },
    prepare({ title, subtitle, order }) {
      return {
        title: `${order ? `#${order} ` : ""}${title}`,
        subtitle: `Anchor: #${subtitle}`,
      };
    },
  },
});
