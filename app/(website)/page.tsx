import Navbar from "./Navbar";
import Hero from "./Hero";
import WhyLearnex from "./WhyLearnex";
import Courses from "./Courses";
import LifeAtLearnex from "./LifeAtLearnex";
import Stats from "./Stats";
import FAQ from "./FAQ";
import CtaBanner from "./CtaBanner";
import ContactSection from "./ContactSection";
import Footer from "./Footer";
import StructuredData from "./StructuredData";
import {
  fetchHeroSlides,
  fetchWhyLearnex,
  fetchCourses,
  fetchLifeAtLearnex,
  fetchStats,
  fetchFAQs,
} from "@/lib/sanity/queries";

export const revalidate = 60;

export default async function Home() {
  const [heroSlides, whyLearnex, courses, lifeAtLearnex, stats, faqs] = await Promise.all([
    fetchHeroSlides(),
    fetchWhyLearnex(),
    fetchCourses(),
    fetchLifeAtLearnex(),
    fetchStats(),
    fetchFAQs(),
  ]);

  return (
    <>
      <StructuredData />
      <Navbar />
      <main>
        <Hero initialSlides={heroSlides} />
        <WhyLearnex initialItems={whyLearnex} />
        <Courses initialCourses={courses} />
        <LifeAtLearnex initialSlides={lifeAtLearnex} />
        <Stats initialStats={stats} />
        <FAQ initialFaqs={faqs} />
        <CtaBanner />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
