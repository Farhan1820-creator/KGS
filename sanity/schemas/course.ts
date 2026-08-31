import { defineField, defineType } from "sanity";

export const courseType = defineType({
  name: "course",
  title: "Courses & Academic Programs",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Course / Program Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle / Tagline",
      type: "string",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "School & O Level", value: "School & O Level" },
          { title: "College & Intermediate", value: "College & Intermediate" },
          { title: "Professional CA", value: "Professional CA" },
          { title: "Digital & Skill Courses", value: "Digital & Skill Courses" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "badge",
      title: "Badge Text (e.g. Cambridge Stream, College Stream, ICAP Professional)",
      type: "string",
    }),
    defineField({
      name: "tag",
      title: "Tag (e.g. INTERNATIONAL CURRICULUM, INTERMEDIATE COLLEGE)",
      type: "string",
    }),
    defineField({
      name: "desc",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "features",
      title: "Key Highlights / Features",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "iconName",
      title: "Lucide Icon Name (e.g. BookOpen, GraduationCap, Briefcase, Palette, Laptop)",
      type: "string",
    }),
    defineField({
      name: "gradient",
      title: "Tailwind Gradient (e.g. from-blue-600 to-indigo-700)",
      type: "string",
    }),
    defineField({
      name: "badgeColor",
      title: "Badge Color Classes (e.g. bg-blue-50 text-blue-700 border-blue-200)",
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
