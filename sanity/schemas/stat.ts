import { defineField, defineType } from "sanity";

export const statType = defineType({
  name: "stat",
  title: "Stats & Achievements",
  type: "document",
  fields: [
    defineField({
      name: "value",
      title: "Stat Value (e.g. PG – Intermediate, Expert Faculty)",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "label",
      title: "Stat Label / Subtext (e.g. Early Foundation to College & CA)",
      type: "string",
      validation: (rule) => rule.required(),
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
