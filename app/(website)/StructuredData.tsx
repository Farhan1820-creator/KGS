export default function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thelearnexacademy.com";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${baseUrl}/#organization`,
    name: "The Learnex Academy",
    alternateName: ["Learnex Academy Multan", "The Learnex Educational Academy"],
    slogan: "Learn, Evolve, Excel",
    url: baseUrl,
    logo: "https://res.cloudinary.com/dggey8rb6/image/upload/v1787375492/logo.png",
    image: "https://res.cloudinary.com/dggey8rb6/image/upload/v1787375492/logo.png",
    description:
      "The Learnex Academy Multan offers Morning Early Foundation Classes (PG to Matric/Intermediate), Cambridge O Level, FSc, ICS, I.Com, CA Subjects (Accounting, Quantitative Methods, Economics, Business), along with Canva Designing, MS Office, AI Presentation, and Spoken English classes.",
    telephone: "+92-316-6581934",
    email: "admissions@thelearnexacademy.com",
    address: [
      {
        "@type": "PostalAddress",
        name: "Branch #1",
        streetAddress: "Near Bloomfield Hall Junior School, Model Town Branch",
        addressLocality: "Multan",
        addressRegion: "Punjab",
        postalCode: "60000",
        addressCountry: "PK",
      },
      {
        "@type": "PostalAddress",
        name: "Branch #2",
        streetAddress: "Jatoi Street, Near Model Town T-Chowk",
        addressLocality: "Multan",
        addressRegion: "Punjab",
        postalCode: "60000",
        addressCountry: "PK",
      },
    ],
    geo: {
      "@type": "GeoCoordinates",
      latitude: "30.1575",
      longitude: "71.5249",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "08:00",
        closes: "21:00",
      },
    ],
    sameAs: [
      "https://facebook.com",
      "https://instagram.com",
      "https://youtube.com",
    ],
    priceRange: "$$",
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "The Learnex Academy Multan",
    description: "Official Website and Portal for The Learnex Academy Multan — Learn, Evolve, Excel",
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
  };

  const courseListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "Course",
        name: "Morning Early Foundation Classes (PG to Intermediate)",
        description:
          "Foundational concept-building and board exam preparation with daily, weekly, and monthly testing routine.",
        provider: {
          "@type": "EducationalOrganization",
          name: "The Learnex Academy",
          sameAs: baseUrl,
        },
      },
      {
        "@type": "Course",
        name: "Cambridge O Level / IGCSE",
        description:
          "Comprehensive Cambridge curriculum instruction with topical and yearly past paper drills in Multan.",
        provider: {
          "@type": "EducationalOrganization",
          name: "The Learnex Academy",
          sameAs: baseUrl,
        },
      },
      {
        "@type": "Course",
        name: "Intermediate College (FSc, ICS, I.Com)",
        description:
          "High-yield board exam coaching in Pre-Medical, Pre-Engineering, Computer Science, and Commerce.",
        provider: {
          "@type": "EducationalOrganization",
          name: "The Learnex Academy",
          sameAs: baseUrl,
        },
      },
      {
        "@type": "Course",
        name: "Chartered Accountancy CA Subjects & PRC Modules",
        description:
          "Specialized coaching for ICAP PRC exams: Accounting, Quantitative Methods, Economics, and Business Writing.",
        provider: {
          "@type": "EducationalOrganization",
          name: "The Learnex Academy",
          sameAs: baseUrl,
        },
      },
      {
        "@type": "Course",
        name: "Canva Designing Masterclass",
        description:
          "Graphic design, social media marketing assets, logos, branding, and presentation creation.",
        provider: {
          "@type": "EducationalOrganization",
          name: "The Learnex Academy",
          sameAs: baseUrl,
        },
      },
      {
        "@type": "Course",
        name: "Microsoft Office Suite Course",
        description:
          "Advanced MS Excel data calculations, MS Word documentation, and MS PowerPoint executive presentations.",
        provider: {
          "@type": "EducationalOrganization",
          name: "The Learnex Academy",
          sameAs: baseUrl,
        },
      },
      {
        "@type": "Course",
        name: "AI Presentation & Smart Tools",
        description:
          "Next-generation presentation design using AI tools, prompt engineering, and visual automation.",
        provider: {
          "@type": "EducationalOrganization",
          name: "The Learnex Academy",
          sameAs: baseUrl,
        },
      },
      {
        "@type": "Course",
        name: "Spoken & Functional English Classes",
        description:
          "Confidence building, spoken fluency, grammar foundations, and communication skills.",
        provider: {
          "@type": "EducationalOrganization",
          name: "The Learnex Academy",
          sameAs: baseUrl,
        },
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Where are The Learnex Academy campuses located in Multan?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Learnex Academy has two branches in Multan: Branch #1 is located Near Bloomfield Hall Junior School Model Town Branch, Multan. Branch #2 is located at Jatoi Street Near Model Town T-Chowk, Multan.",
        },
      },
      {
        "@type": "Question",
        name: "How can I contact The Learnex Academy Multan for admissions?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can call or WhatsApp our official helpline at 0316-6581934 or visit our branches Monday through Saturday between 8:00 AM and 9:00 PM.",
        },
      },
      {
        "@type": "Question",
        name: "What testing routine is followed at The Learnex Academy?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We follow a disciplined testing methodology consisting of Daily, Weekly, and Monthly test sessions with instant performance tracking on our student portal.",
        },
      },
      {
        "@type": "Question",
        name: "What courses and classes are currently open for admission?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Admissions are open for Morning Early Foundation Classes (PG to Intermediate), O Level, FSc, ICS, I.Com, CA Subjects (Accounting, Quantitative Methods, Economics, Business), Canva Designing, MS Office, AI Presentation, and English Classes.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseListSchema) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
