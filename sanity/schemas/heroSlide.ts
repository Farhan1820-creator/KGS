import { defineField, defineType } from "sanity";

export const heroSlideType = defineType({
  name: "heroSlide",
  title: "Hero Slides",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title / Main Heading",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "badge",
      title: "Badge / Tagline",
      type: "string",
    }),
    defineField({
      name: "desc",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "caption",
      title: "Image Caption",
      type: "string",
    }),
    defineField({
      name: "image",
      title: "Slide Image (Upload)",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "imageUrl",
      title: "Slide Image URL (Fallback / Unsplash)",
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
