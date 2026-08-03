import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CapsuleBar from '@/components/CapsuleBar';
import HeroDiagram from '@/components/HeroDiagram';
import ProviderStrip from '@/components/ProviderStrip';
import Capabilities from '@/components/Capabilities';
import CodeSection from '@/components/CodeSection';
import Benchmarks from '@/components/Benchmarks';
import Footer from '@/components/Footer';
import FloatingCommand from '@/components/FloatingCommand';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center selection:bg-ink selection:text-surface">
      <Navbar />
      
      <div className="w-full flex-1 mt-16">
        <Hero />
        <CapsuleBar />
        <HeroDiagram />
        <ProviderStrip />
        <Capabilities />
        <CodeSection />
        <Benchmarks />
      </div>

      <Footer />
      <FloatingCommand />
    </main>
  );
}
