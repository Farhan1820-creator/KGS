import { defineField, defineType } from "sanity";

export const lifeAtLearnexType = defineType({
  name: "lifeAtLearnex",
  title: "Life at Learnex (Campus Gallery)",
  type: "document",
  fields: [
    defineField({
      name: "caption",
      title: "Caption / Description",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "image",
      title: "Campus Photo (Upload)",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "imageUrl",
      title: "Photo URL (Fallback / External)",
      type: "url",
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
