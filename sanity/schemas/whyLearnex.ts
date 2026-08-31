import { defineField, defineType } from "sanity";

export const whyLearnexType = defineType({
  name: "whyLearnex",
  title: "Why Learnex (Features / USPs)",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title / Feature Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "desc",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "iconName",
      title: "Lucide Icon Name (e.g. ClipboardCheck, Users2, Award, GraduationCap, Laptop, Building)",
      type: "string",
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      initialValue: 1,
    }),
  ],
  orderings: [
    {
      title: "Order Ascending",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});
