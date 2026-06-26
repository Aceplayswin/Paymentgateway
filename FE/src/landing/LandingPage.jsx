import "./landing.css";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Trust from "./components/Trust";
import Features from "./components/Features";
import Solutions from "./components/Solutions";
import Methods from "./components/Methods";
import Developers from "./components/Developers";
import Security from "./components/Security";
import Analytics from "./components/Analytics";
import Industries from "./components/Industries";
import Testimonials from "./components/Testimonials";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import ContactUs from "./components/ContactUs";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

export default function LandingPage() {
  return (
    <div className="landing-site">
      <Header />
      <main>
        <Hero />
        <Trust />
        <Features />
        <Solutions />
        <Methods />
        <Developers />
        <Security />
        <Analytics />
        <Industries />
        <Testimonials />
        <Pricing />
        <FAQ />
        <ContactUs />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}