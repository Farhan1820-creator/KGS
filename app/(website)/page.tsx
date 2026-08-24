import Navbar from "./Navbar";
import Hero from "./Hero";
import WhyLearnex from "./WhyLearnex";
import Courses from "./Courses";
import CinematicVideo from "./CinematicVideo";
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
    "The Learnex Academy offers premier academic coaching for School (PG–Matric), O Level, College Intermediate (FSc, ICom, ICS), University/Bachelor students, and CA (PRC), along with practical Canva and MS Office courses.",
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
        <CinematicVideo />
        <Stats />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
