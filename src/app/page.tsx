import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import InViewReveal from "@/components/primitives/InViewReveal";
import { sections } from "@/sections";

export default function Home() {
  return (
    <>
      <Navbar />
      <InViewReveal />
      <main>
        {sections.map(({ id, Component }) => (
          <Component key={id} />
        ))}
      </main>
      <Footer />
    </>
  );
}
