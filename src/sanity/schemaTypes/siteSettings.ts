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
