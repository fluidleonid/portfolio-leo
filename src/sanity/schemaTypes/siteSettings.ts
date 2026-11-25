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
      initialValue: "Leonid Dmitriev — Product Designer",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description (displayed in search engines & messengers)",
      type: "text",
      rows: 3,
      initialValue:
        "Portfolio of Leonid Dmitriev: Product Designer specializing in complex B2B platforms, enterprise tools, and FinTech systems.",
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
      initialValue: "https://portfolio-leo-virid.vercel.app",
    }),
    defineField({
      name: "keywords",
      title: "Search Keywords",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      initialValue: [
        "Leonid Dmitriev",
        "Leo Dmitriev",
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
    defineField({
      name: "petLabelInterval",
      title: "PET Label Switch Interval (seconds)",
      type: "number",
      description:
        "How often the 'PET • PROJECT NAME' label switches to the next pet project (in seconds, default: 2).",
      initialValue: 2,
      validation: (Rule) => Rule.min(0.5).max(60),
    }),
    defineField({
      name: "cassetteAudio",
      title: "About Cassette Audio Track",
      type: "file",
      options: {
        accept: "audio/*",
      },
      description:
        "Upload an audio track (.mp3, .wav, .ogg, .m4a) for the Cassette Player at the bottom of the About section.",
    }),
    defineField({
      name: "cassetteTitle",
      title: "Cassette Label Title",
      type: "string",
      description: "Handwritten title printed on the cassette label (default: Working Mix).",
      initialValue: "Working Mix",
    }),
    defineField({
      name: "cassetteArtist",
      title: "Cassette Label Subtitle / Artist",
      type: "string",
      description: "Subtitle printed under the cassette title (default: League of Legends).",
      initialValue: "League of Legends",
    }),
  ],
});
