import { defineType, defineField, defineArrayMember } from "sanity";
import { MultipleImageUploadInput } from "../components/MultipleImageUploadInput";

/**
 * Reusable Modular Content Blocks for Case Studies
 * Each block can be used freely inside any Section (or inside legacy blocks).
 * All headings, badges, and anchors on every block are strictly optional.
 * If a block defines an `anchor`, the parent section in TopBar splits into sub-segments.
 */
export const caseBlockMembers = [
  // 1. 2-Column Metadata / Spec Table
  defineArrayMember({
    name: "metadataTable",
    title: "Spec / Key-Value Table",
    description: "2-колоночная таблица характеристик или спецификаций (Role, Team, Scope, Tools, Deliverables, Client)",
    type: "object",
    fields: [
      defineField({
        name: "anchor",
        title: "Tuner Anchor / ID (Опциональный якорь блока)",
        type: "string",
        description:
          "Если заполнено, секция в TopBar дробится на сегменты, и этот блок становится отдельной засечкой в шкале радио-тюнера.",
      }),
      defineField({
        name: "badge",
        title: "Badge (Optional)",
        type: "string",
      }),
      defineField({
        name: "title",
        title: "Block Title (Optional)",
        type: "string",
      }),
      defineField({
        name: "rows",
        title: "Rows",
        type: "array",
        of: [
          defineArrayMember({
            type: "object",
            fields: [
              defineField({ name: "label", title: "Key / Label", type: "string" }),
              defineField({ name: "value", title: "Value", type: "string" }),
            ],
            preview: {
              select: { title: "label", subtitle: "value" },
            },
          }),
        ],
      }),
    ],
    preview: {
      select: { title: "title", anchor: "anchor" },
      prepare({ title, anchor }) {
        const tag = anchor ? ` [#${anchor}]` : "";
        return {
          title: (title || "Spec Table") + tag,
          subtitle: "Key-Value Spec Grid",
        };
      },
    },
  }),

  // 2. Section Heading / Lead Text
  defineArrayMember({
    name: "sectionHeading",
    title: "Heading & Lead Text",
    description: "Акцентный заголовок с вводным описанием / лид-абзацем",
    type: "object",
    fields: [
      defineField({
        name: "anchor",
        title: "Tuner Anchor / ID (Опциональный якорь блока)",
        type: "string",
        description:
          "Если заполнено, секция в TopBar дробится на сегменты, и этот блок становится отдельной засечкой в шкале радио-тюнера.",
      }),
      defineField({
        name: "badge",
        title: "Badge (Optional)",
        type: "string",
      }),
      defineField({
        name: "title",
        title: "Title (Optional)",
        type: "string",
      }),
      defineField({
        name: "description",
        title: "Description / Lead Text",
        type: "text",
        rows: 3,
      }),
    ],
    preview: {
      select: { title: "title", subtitle: "badge", anchor: "anchor" },
      prepare({ title, subtitle, anchor }) {
        const tag = anchor ? ` [#${anchor}]` : "";
        return {
          title: (title || "Heading & Lead") + tag,
          subtitle: subtitle ? `[${subtitle}]` : "Heading Block",
        };
      },
    },
  }),

  // 3. Problem / Point List
  defineArrayMember({
    name: "problemList",
    title: "Points List (with Tags/Metrics)",
    description:
      "Универсальный структурированный список пунктов с тире: проблемы, барьеры, предпосылки, гипотезы, задачи. Каждый пункт поддерживает заголовок, описание и тег/метрику.",
    type: "object",
    fields: [
      defineField({
        name: "anchor",
        title: "Tuner Anchor / ID (Опциональный якорь блока)",
        type: "string",
        description:
          "Если заполнено, секция в TopBar дробится на сегменты, и этот блок становится отдельной засечкой в шкале радио-тюнера.",
      }),
      defineField({
        name: "badge",
        title: "Badge (Optional)",
        type: "string",
      }),
      defineField({
        name: "title",
        title: "Block Title (Optional)",
        type: "string",
      }),
      defineField({
        name: "items",
        title: "Items",
        type: "array",
        of: [
          defineArrayMember({
            type: "object",
            fields: [
              defineField({ name: "title", title: "Item Title", type: "string" }),
              defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
              defineField({
                name: "metric",
                title: "Tag / Metric (Optional, e.g. '3 days', 'Critical', '0 tolerance')",
                type: "string",
              }),
            ],
            preview: {
              select: { title: "title", subtitle: "metric" },
            },
          }),
        ],
      }),
    ],
    preview: {
      select: { title: "title", items: "items", anchor: "anchor" },
      prepare({ title, items, anchor }) {
        const count = Array.isArray(items) ? items.length : 0;
        const tag = anchor ? ` [#${anchor}]` : "";
        return {
          title: (title || "Points List") + tag,
          subtitle: `${count} item${count === 1 ? "" : "s"}`,
        };
      },
    },
  }),

  // 4. Cards Block (Separate cards with #242424 background, no border, optional title & description)
  defineArrayMember({
    name: "cardsBlock",
    title: "Cards List (Карточки #242424)",
    description:
      "Отдельные карточки с фоном #242424 без бордера (ставки, предпосылки, гипотезы, ключевые решения). Опциональный заголовок и описание блока.",
    type: "object",
    fields: [
      defineField({
        name: "anchor",
        title: "Tuner Anchor / ID (Опциональный якорь блока)",
        type: "string",
        description:
          "Если заполнено, секция в TopBar дробится на сегменты, и этот блок становится отдельной засечкой в шкале радио-тюнера.",
      }),
      defineField({
        name: "badge",
        title: "Badge (Optional)",
        type: "string",
      }),
      defineField({
        name: "title",
        title: "Block Title (Optional)",
        type: "string",
      }),
      defineField({
        name: "description",
        title: "Block Description / Lead (Optional)",
        type: "text",
        rows: 3,
        description: "Опциональное вводное описание перед карточками",
      }),
      defineField({
        name: "items",
        title: "Cards (Карточки)",
        type: "array",
        of: [
          defineArrayMember({
            type: "object",
            fields: [
              defineField({
                name: "title",
                title: "Card Title (Заголовок карточки)",
                type: "string",
              }),
              defineField({
                name: "description",
                title: "Card Text / Description (Текст карточки)",
                type: "text",
                rows: 3,
              }),
              defineField({
                name: "tag",
                title: "Tag / Metric (Optional)",
                type: "string",
              }),
            ],
            preview: {
              select: { title: "title", subtitle: "description" },
            },
          }),
        ],
      }),
    ],
    preview: {
      select: { title: "title", items: "items", anchor: "anchor" },
      prepare({ title, items, anchor }) {
        const count = Array.isArray(items) ? items.length : 0;
        const tag = anchor ? ` [#${anchor}]` : "";
        return {
          title: (title || "Cards List") + tag,
          subtitle: `${count} card${count === 1 ? "" : "s"}`,
        };
      },
    },
  }),

  // 5. Team / Roles Roster
  defineArrayMember({
    name: "teamSection",
    title: "Roles & Roster List",
    description: "Список участников команды или задействованных ролей в формате 'Роль: Имя / Описание'",
    type: "object",
    fields: [
      defineField({
        name: "anchor",
        title: "Tuner Anchor / ID (Опциональный якорь блока)",
        type: "string",
        description:
          "Если заполнено, секция в TopBar дробится на сегменты, и этот блок становится отдельной засечкой в шкале радио-тюнера.",
      }),
      defineField({
        name: "badge",
        title: "Badge (Optional)",
        type: "string",
      }),
      defineField({
        name: "title",
        title: "Block Title (Optional)",
        type: "string",
      }),
      defineField({
        name: "composition",
        title: "Roles & People",
        type: "array",
        of: [
          defineArrayMember({
            type: "object",
            fields: [
              defineField({ name: "role", title: "Role / Category", type: "string" }),
              defineField({ name: "name", title: "Name / Size / Details", type: "string" }),
              defineField({ name: "details", title: "Extra Details (Optional)", type: "string" }),
            ],
            preview: {
              select: { title: "role", subtitle: "name" },
            },
          }),
        ],
      }),
    ],
    preview: {
      select: { title: "title", anchor: "anchor" },
      prepare({ title, anchor }) {
        const tag = anchor ? ` [#${anchor}]` : "";
        return {
          title: (title || "Roles & Roster") + tag,
        };
      },
    },
  }),

  // 5. Insights & Research
  defineArrayMember({
    name: "discoverySection",
    title: "Insights & Research (with Stats)",
    description: "Исследовательский блок: строка методики (Method: ...) и список инсайтов с выделенными показателями/статами справа",
    type: "object",
    fields: [
      defineField({
        name: "anchor",
        title: "Tuner Anchor / ID (Опциональный якорь блока)",
        type: "string",
        description:
          "Если заполнено, секция в TopBar дробится на сегменты, и этот блок становится отдельной засечкой в шкале радио-тюнера.",
      }),
      defineField({
        name: "badge",
        title: "Badge (Optional)",
        type: "string",
      }),
      defineField({
        name: "title",
        title: "Block Title (Optional)",
        type: "string",
      }),
      defineField({
        name: "method",
        title: "Methodology (e.g. Contextual inquiry, Mouseflow, User interviews)",
        type: "string",
      }),
      defineField({
        name: "findings",
        title: "Key Findings / Insights",
        type: "array",
        of: [
          defineArrayMember({
            type: "object",
            fields: [
              defineField({ name: "title", title: "Insight Title", type: "string" }),
              defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
              defineField({ name: "stat", title: "Stat / Highlight (e.g. '92% preference', '100% drop')", type: "string" }),
            ],
            preview: {
              select: { title: "title", subtitle: "stat" },
            },
          }),
        ],
      }),
    ],
    preview: {
      select: { title: "title", method: "method", anchor: "anchor" },
      prepare({ title, method, anchor }) {
        const tag = anchor ? ` [#${anchor}]` : "";
        return {
          title: (title || "Insights & Research") + tag,
          subtitle: method || "Research block",
        };
      },
    },
  }),

  // 6. Hypotheses & Validation
  defineArrayMember({
    name: "hypothesesSection",
    title: "Hypotheses & Outcomes",
    description: "Список гипотез с описанием логики и ожидаемым результатом (Expected outcome)",
    type: "object",
    fields: [
      defineField({
        name: "anchor",
        title: "Tuner Anchor / ID (Опциональный якорь блока)",
        type: "string",
        description:
          "Если заполнено, секция в TopBar дробится на сегменты, и этот блок становится отдельной засечкой в шкале радио-тюнера.",
      }),
      defineField({
        name: "badge",
        title: "Badge (Optional)",
        type: "string",
      }),
      defineField({
        name: "title",
        title: "Block Title (Optional)",
        type: "string",
      }),
      defineField({
        name: "items",
        title: "Hypotheses",
        type: "array",
        of: [
          defineArrayMember({
            type: "object",
            fields: [
              defineField({ name: "title", title: "Hypothesis / Solution", type: "string" }),
              defineField({ name: "description", title: "Rationale / Implementation", type: "text", rows: 2 }),
              defineField({ name: "expectedOutcome", title: "Expected Outcome", type: "string" }),
            ],
            preview: {
              select: { title: "title", subtitle: "expectedOutcome" },
            },
          }),
        ],
      }),
    ],
    preview: {
      select: { title: "title", anchor: "anchor" },
      prepare({ title, anchor }) {
        const tag = anchor ? ` [#${anchor}]` : "";
        return {
          title: (title || "Hypotheses & Outcomes") + tag,
        };
      },
    },
  }),

  // 7. Horizontal Breakout Gallery
  defineArrayMember({
    name: "galleryBlock",
    title: "Image Gallery (Slider)",
    description: "Горизонтальная full-bleed галерея с кастомным скролл-баром/прогресс-баром и тултипами",
    type: "object",
    fields: [
      defineField({
        name: "anchor",
        title: "Tuner Anchor / ID (Опциональный якорь блока)",
        type: "string",
        description:
          "Если заполнено, секция в TopBar дробится на сегменты, и этот блок становится отдельной засечкой в шкале радио-тюнера.",
      }),
      defineField({
        name: "badge",
        title: "Badge (Optional)",
        type: "string",
      }),
      defineField({
        name: "title",
        title: "Gallery Title (Optional)",
        type: "string",
      }),
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
            fields: [
              defineField({
                name: "alt",
                title: "Alt Text / Описание для тултипа",
                type: "string",
                description:
                  "Текст для всплывающего тултипа на прогресс-баре галереи (шрифт Hauora 10px)",
              }),
            ],
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
              defineField({
                name: "alt",
                title: "Alt Text / Описание для тултипа",
                type: "string",
              }),
            ],
            preview: {
              select: { title: "url", subtitle: "alt" },
            },
          }),
        ],
      }),
      defineField({
        name: "height",
        title: "Height (px)",
        type: "number",
        initialValue: 600,
      }),
      defineField({
        name: "caption",
        title: "Caption",
        type: "string",
      }),
    ],
    preview: {
      select: { title: "title", images: "images", anchor: "anchor" },
      prepare({ title, images, anchor }) {
        const count = Array.isArray(images) ? images.length : 0;
        const tag = anchor ? ` [#${anchor}]` : "";
        return {
          title: (title || "Image Gallery") + tag,
          subtitle: `${count} image${count === 1 ? "" : "s"}`,
        };
      },
    },
  }),

  // 8. Results & Impact Metrics
  defineArrayMember({
    name: "metricsBlock",
    title: "Metric Cards (KPIs / Stats)",
    description: "Сетка аппаратных карточек с крупными цифрами (KPIs, результаты, бизнес-эффект)",
    type: "object",
    fields: [
      defineField({
        name: "anchor",
        title: "Tuner Anchor / ID (Опциональный якорь блока)",
        type: "string",
        description:
          "Если заполнено, секция в TopBar дробится на сегменты, и этот блок становится отдельной засечкой в шкале радио-тюнера.",
      }),
      defineField({
        name: "badge",
        title: "Badge (Optional)",
        type: "string",
      }),
      defineField({
        name: "title",
        title: "Block Title (Optional)",
        type: "string",
      }),
      defineField({
        name: "items",
        title: "Metrics",
        type: "array",
        of: [
          defineArrayMember({
            type: "object",
            fields: [
              defineField({
                name: "value",
                title: "Impact Value (e.g. 70%, 15 min, 2.5x)",
                type: "string",
              }),
              defineField({ name: "label", title: "Metric Label", type: "string" }),
              defineField({ name: "description", title: "Context / Proof", type: "text", rows: 2 }),
            ],
            preview: {
              select: { title: "value", subtitle: "label" },
            },
          }),
        ],
      }),
    ],
    preview: {
      select: { title: "title", items: "items", anchor: "anchor" },
      prepare({ title, items, anchor }) {
        const count = Array.isArray(items) ? items.length : 0;
        const tag = anchor ? ` [#${anchor}]` : "";
        return {
          title: (title || "Metric Cards") + tag,
          subtitle: `${count} metric${count === 1 ? "" : "s"}`,
        };
      },
    },
  }),

  // 9. Plain / Story Paragraphs
  defineArrayMember({
    name: "textBlock",
    title: "Text / Paragraphs",
    description: "Обычный текстовый блок для связного повествования (поддерживает разделение на параграфы)",
    type: "object",
    fields: [
      defineField({
        name: "anchor",
        title: "Tuner Anchor / ID (Опциональный якорь блока)",
        type: "string",
        description:
          "Если заполнено, секция в TopBar дробится на сегменты, и этот блок становится отдельной засечкой в шкале радио-тюнера.",
      }),
      defineField({
        name: "badge",
        title: "Badge (Optional)",
        type: "string",
      }),
      defineField({
        name: "title",
        title: "Block Title (Optional)",
        type: "string",
      }),
      defineField({
        name: "content",
        title: "Paragraphs Content",
        type: "text",
        rows: 4,
      }),
    ],
    preview: {
      select: { title: "title", content: "content", anchor: "anchor" },
      prepare({ title, content, anchor }) {
        const tag = anchor ? ` [#${anchor}]` : "";
        return {
          title: (title || "Text Block") + tag,
          subtitle: content ? content.slice(0, 60) + "..." : "Empty",
        };
      },
    },
  }),

  // 10. Quote Callout
  defineArrayMember({
    name: "quoteCallout",
    title: "Quote / Callout",
    description: "Выделенная цитата пользователя, клиента или ключевой вывод с автором и ролью",
    type: "object",
    fields: [
      defineField({
        name: "anchor",
        title: "Tuner Anchor / ID (Опциональный якорь блока)",
        type: "string",
        description:
          "Если заполнено, секция в TopBar дробится на сегменты, и этот блок становится отдельной засечкой в шкале радио-тюнера.",
      }),
      defineField({
        name: "badge",
        title: "Badge (Optional)",
        type: "string",
      }),
      defineField({
        name: "title",
        title: "Block Title (Optional)",
        type: "string",
      }),
      defineField({
        name: "quote",
        title: "Quote text",
        type: "text",
        rows: 2,
      }),
      defineField({ name: "author", title: "Author", type: "string" }),
      defineField({ name: "role", title: "Role", type: "string" }),
    ],
    preview: {
      select: { title: "quote", subtitle: "author", anchor: "anchor" },
      prepare({ title, subtitle, anchor }) {
        const tag = anchor ? ` [#${anchor}]` : "";
        return {
          title: (title ? `"${title.slice(0, 50)}..."` : "Quote") + tag,
          subtitle: subtitle || "Quote block",
        };
      },
    },
  }),
];

/**
 * Case Section Member Definition
 * Sections structure the case study into distinct chapters (overview, discovery, design, impact, etc.)
 * Each Section has an anchor that links into the TopBar radio tuner.
 */
export const caseSectionMember = defineArrayMember({
  name: "caseSection",
  title: "Case Section (Раздел кейса)",
  type: "object",
  fields: [
    defineField({
      name: "anchor",
      title: "Tuner Anchor / ID (Якорь для топбара)",
      type: "string",
      description:
        "Идентификатор раздела для верхнего радио-тюнера TopBar (например: overview, discovery, design, impact, team). Только строчные буквы и дефис.",
      validation: (Rule) =>
        Rule.required()
          .regex(/^[a-z0-9_-]+$/, {
            name: "slug",
            invert: false,
          })
          .error("Якорь должен состоять только из строчных букв, цифр и дефиса (например: overview, discovery, design)"),
    }),
    defineField({
      name: "title",
      title: "Section Heading (Опциональный заголовок секции)",
      type: "string",
      description: "Опциональный заголовок, отображаемый над блоками секции (шрифт Hauora 18px)",
    }),
    defineField({
      name: "blocks",
      title: "Section Blocks (Блоки внутри раздела)",
      type: "array",
      description:
        "Добавляйте любые блоки в этот раздел (галерея, проблемы, метрики, команда, текст и т.д.)",
      of: caseBlockMembers,
    }),
  ],
  preview: {
    select: {
      anchor: "anchor",
      title: "title",
      blocks: "blocks",
    },
    prepare({ anchor, title, blocks }) {
      const count = Array.isArray(blocks) ? blocks.length : 0;
      const anchorTag = anchor ? `[${anchor}]` : "[untitled]";
      return {
        title: title ? `${title} · ${anchorTag}` : anchorTag,
        subtitle: `${count} ${count === 1 ? "block" : "blocks"} inside`,
      };
    },
  },
});

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

    // 1. New Structured Sections
    defineField({
      name: "sections",
      title: "Case Sections (Разделы кейса)",
      type: "array",
      description:
        "Секции кейса (например: overview, discovery, design, impact). Каждая секция формирует станцию в верхнем радио-тюнере TopBar и содержит в себе любые блоки.",
      of: [caseSectionMember],
    }),

    // 2. Legacy Flat Blocks (Maintained for complete backward-compatibility)
    defineField({
      name: "blocks",
      title: "Legacy Blocks (Deprecated — используйте Секции выше)",
      type: "array",
      description: "Старые плоские блоки. Рекомендуется использовать секции выше.",
      hidden: ({ document }) =>
        Boolean(Array.isArray(document?.sections) && document.sections.length > 0),
      of: caseBlockMembers,
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
      sections: "sections",
    },
    prepare({ title, order, projectName, buttonLabel, isButtonActive, media, sections }) {
      const status = isButtonActive !== false ? "🟢 ON" : "⚪ OFF";
      const btn = buttonLabel ? ` [Btn: ${buttonLabel}]` : "";
      const orderPrefix = order ? `#${order} ` : "";
      const secCount = Array.isArray(sections) ? sections.length : 0;
      const secInfo = secCount > 0 ? ` · ${secCount} sections` : "";
      return {
        title: `${orderPrefix}${title}`,
        subtitle: `Project: ${projectName || "Unassigned"}${btn}${secInfo} · ${status}`,
        media,
      };
    },
  },
});
