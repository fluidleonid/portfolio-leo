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
      name: "caseStudy",
      title: "Linked Case Study (Привязанный кейс)",
      type: "reference",
      to: [{ type: "caseStudy" }],
      description:
        "Кейс, привязанный к этому проекту. Название кнопки и ссылка на страницу /case/[slug] берутся из него автоматически.",
    }),
    defineField({
      name: "isCaseActive",
      title: "Кнопка кейса включена (Индикатор горит)",
      type: "boolean",
      description:
        "Включает или выключает кнопку кейса на главной странице (лампа горит и переход в кейс активен).",
      initialValue: true,
    }),
    defineField({
      name: "customCaseLabel",
      title: "Кастомный текст кнопки (необязательно)",
      type: "string",
      description:
        "Оставьте пустым, чтобы название кнопки бралось автоматически из заголовка кейса.",
    }),
    defineField({
      name: "customCaseUrl",
      title: "Внешняя ссылка (если кейс на Framer / Figma)",
      type: "url",
      description: "Например: https://leodmitriev.framer.website/work/vlog-editor",
    }),
    defineField({
      name: "secondCaseTitle",
      title: "Второй кейс / драфт (название второй кнопки)",
      type: "string",
      description:
        "Например: Enterprise Design System (опционально для второго слота кнопки).",
    }),
    defineField({
      name: "secondCaseActive",
      title: "Вторая кнопка включена",
      type: "boolean",
      description: "Включена ли вторая кнопка (лампа горит / погашена).",
      initialValue: false,
    }),
    defineField({
      name: "secondCaseStudy",
      title: "Второй кейс Sanity (если есть второй кейс)",
      type: "reference",
      to: [{ type: "caseStudy" }],
    }),
    defineField({
      name: "caseStudies",
      title: "Advanced Case Studies Array (Legacy / Дополнительно)",
      type: "array",
      description:
        "Используйте только если нужно добавить больше 2 кнопок вручную.",
      of: [
        defineArrayMember({
          type: "reference",
          name: "caseStudyRef",
          title: "Direct Case Study",
          to: [{ type: "caseStudy" }],
        }),
        defineArrayMember({
          type: "object",
          name: "caseLink",
          title: "Custom Case Link",
          fields: [
            defineField({
              name: "caseStudy",
              title: "Linked Sanity Case Study",
              type: "reference",
              to: [{ type: "caseStudy" }],
            }),
            defineField({
              name: "label",
              title: "Button Label",
              type: "string",
            }),
            defineField({
              name: "externalUrl",
              title: "External URL",
              type: "url",
            }),
            defineField({
              name: "active",
              title: "Indicator Lamp Active",
              type: "boolean",
              initialValue: true,
            }),
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
      subtitle: "anchorId",
      order: "order",
      projectType: "projectType",
      isCaseActive: "isCaseActive",
      caseTitle: "caseStudy.title",
    },
    prepare({ title, subtitle, order, projectType, isCaseActive, caseTitle }) {
      const types = Array.isArray(projectType)
        ? projectType.join(" / ")
        : projectType || "";
      const status =
        isCaseActive !== false ? "🟢 Case ON" : "⚪ Case OFF";
      const caseInfo = caseTitle ? ` · [${caseTitle}]` : "";
      return {
        title: `${order ? `#${order} ` : ""}${title}${types ? ` · [${types}]` : ""}`,
        subtitle: `Anchor: #${subtitle} · ${status}${caseInfo}`,
      };
    },
  },
});
