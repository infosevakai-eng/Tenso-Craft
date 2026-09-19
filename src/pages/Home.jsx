import Hero from "../components/home/Hero";
import StatsBar from "../components/home/StatsBar";
import SolutionsGrid from "../components/home/SolutionsGrid";
import ProcessBanner from "../components/home/ProcessBanner";
import WhyUs from "../components/home/WhyUs";
import MaterialsTech from "../components/home/MaterialsTech";
import IndustriesServed from "../components/home/IndustriesServed";
import Testimonials from "../components/home/Testimonials";
import FinalCTA from "../components/home/FinalCTA";

export default function Home() {
  return (
    <main>
      <Hero />
      <StatsBar />
      <SolutionsGrid />
      <ProcessBanner />
      <WhyUs />
      <MaterialsTech />
      <IndustriesServed />
      <Testimonials />
      <FinalCTA />
    </main>
  );
}