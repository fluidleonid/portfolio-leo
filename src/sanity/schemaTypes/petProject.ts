import { defineType, defineField } from "sanity";

export const petProjectType = defineType({
  name: "petProject",
  title: "Pet Projects (Hero PET)",
  type: "document",
  fields: [
    defineField({
      name: "order",
      title: "Order / Button Slot (1, 2, 3...)",
      type: "number",
      description:
        "Determines the display order and default button number in the Hero PET section.",
      initialValue: 1,
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "buttonLabel",
      title: "Button Label (Optional, e.g. '1', '2', '3')",
      type: "string",
      description:
        "Short 1-2 character label shown on the illuminated PET lamp button. Defaults to the order number if left empty.",
    }),
    defineField({
      name: "shortName",
      title: "Short Label Name (PET • PROJECT NAME)",
      type: "string",
      description:
        "Short uppercase name animated in the 'PET • ...' section label every 2 seconds. Falls back to Title if empty.",
    }),
    defineField({
      name: "title",
      title: "Project Title (Sheet Heading)",
      type: "string",
      description: "Main title displayed inside the slide-over / bottom sheet.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "pitch",
      title: "Short Description / Pitch",
      type: "text",
      rows: 3,
      description:
        "Brief description displayed directly below the title in the sheet (styled like Case Study title & pitch).",
    }),
    defineField({
      name: "embedUrl",
      title: "Embed URL (iframe src)",
      type: "url",
      description:
        "Direct URL to embed inside the sheet (e.g. live web app, Figma embed, CodeSandbox, Loom, or interactive prototype).",
      validation: (Rule) =>
        Rule.uri({
          allowRelative: true,
          scheme: ["http", "https"],
        }),
    }),
    defineField({
      name: "externalUrl",
      title: "External Link URL (Optional 'Open ↗' link)",
      type: "url",
      description:
        "Optional URL for the 'Open in new tab' link in the sheet header. Falls back to Embed URL if empty.",
      validation: (Rule) =>
        Rule.uri({
          allowRelative: true,
          scheme: ["http", "https"],
        }),
    }),
    defineField({
      name: "isActive",
      title: "Active / Published",
      type: "boolean",
      initialValue: true,
      description: "Uncheck to hide this pet project from the main page.",
    }),
  ],
  orderings: [
    {
      title: "Order Ascending",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      shortName: "shortName",
      order: "order",
      isActive: "isActive",
    },
    prepare({ title, shortName, order, isActive }) {
      const status = isActive === false ? " [Hidden]" : "";
      const badge = shortName ? ` • ${shortName.toUpperCase()}` : "";
      return {
        title: `${order ?? "#"}. ${title || "Untitled Pet Project"}${status}`,
        subtitle: `PET${badge}`,
      };
    },
  },
});
