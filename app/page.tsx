import Hero from "@/components/home/Hero";
import TechStack from "@/components/home/TechStack";
import Experience from "@/components/home/Experience";
import Projects from "@/components/home/Projects";
import Education from "@/components/home/Education";
import SectionDivider from "@/components/ui/SectionDivider";

export default function Home() {
  return (
    <div className="home-container">
      <Hero />
      <SectionDivider />
      <TechStack />
      <SectionDivider />
      <Experience />
      <SectionDivider />
      <Projects />
      <SectionDivider />
      <Education />
    </div>
  );
}
