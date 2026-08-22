import Navbar from "./Navbar";
import Hero from "./Hero";
import WhyLearnex from "./WhyLearnex";
import Courses from "./Courses";
import Stats from "./Stats";
import CtaBanner from "./CtaBanner";
import Footer from "./Footer";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "The Learnex Academy",
  url: "https://www.thelearnexacademy.com",
  logo: "https://www.thelearnexacademy.com/logo.png",
  description:
    "The Learnex Academy helps students build real, practical skills through structured courses and mentorship.",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Navbar />
      <main>
        <Hero />
        <WhyLearnex />
        <Courses />
        <Stats />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
