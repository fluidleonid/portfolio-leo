import { defineType, defineField, defineArrayMember } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site Settings & SEO",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Document Title",
      type: "string",
      initialValue: "Portfolio Settings",
    }),
    defineField({
      name: "heroName",
      title: "Hero Name (Heading on main page)",
      type: "string",
      initialValue: "Leonid Dmitriev",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "heroBio",
      title: "Hero Bio (Under name on main page)",
      type: "text",
      rows: 3,
      initialValue:
        "Product Designer · Frontend-fluent\n4+ years at B2B(2C) across FinTech,\nProductivity, Entertainment & AI products",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "ledImages",
      title: "Hero LED Matrix Images",
      type: "array",
      description:
        "Upload images (WebP/PNG) or specify image paths for the animated LED matrix in the Hero section. Rotates automatically.",
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
              title: "Path or URL (e.g. /portrait.webp or /portrait.png)",
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
      name: "siteTitle",
      title: "Page Title (displayed in browser tab & Google search)",
      type: "string",
      initialValue: "Leo Rogov — Product Designer",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description (displayed in search engines & messengers)",
      type: "text",
      rows: 3,
      initialValue:
        "Portfolio of Leo Rogov: Senior Product Designer specializing in complex B2B platforms, enterprise tools, and FinTech systems.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "favicon",
      title: "Favicon (Browser tab icon)",
      type: "image",
      options: { hotspot: true },
      description: "Upload .png, .ico, or .svg icon for browser tab",
    }),
    defineField({
      name: "ogImage",
      title: "Social Share Banner (OpenGraph Preview)",
      type: "image",
      options: { hotspot: true },
      description:
        "Banner preview image shown when sharing the site link in Telegram, WhatsApp, Twitter, LinkedIn, iMessage (recommended: 1200x630px)",
    }),
    defineField({
      name: "siteUrl",
      title: "Canonical Site URL",
      type: "url",
      initialValue: "https://leo-portfolio-orpin.vercel.app",
    }),
    defineField({
      name: "keywords",
      title: "Search Keywords",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      initialValue: [
        "Leo Rogov",
        "Product Designer",
        "Design Systems",
        "B2B SaaS",
        "UX Architecture",
        "FinTech",
        "Revit CAD",
      ],
    }),
    defineField({
      name: "aboutParagraphs",
      title: "About Me Paragraphs (Main page bottom)",
      type: "array",
      of: [defineArrayMember({ type: "text", rows: 3 })],
    }),
  ],
});
