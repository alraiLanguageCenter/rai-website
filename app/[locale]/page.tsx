import { setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/sections/Header';
import { Hero } from '@/components/sections/Hero';
import { BrandStrip } from '@/components/sections/BrandStrip';
import { TrustStrip } from '@/components/sections/TrustStrip';
import { Story } from '@/components/sections/Story';
import { Announcements } from '@/components/sections/Announcements';
import { Courses } from '@/components/sections/Courses';
import { WhyUs } from '@/components/sections/WhyUs';
import { Schedule } from '@/components/sections/Schedule';
import { WallOfWins } from '@/components/sections/WallOfWins';
import { Testimonials } from '@/components/sections/Testimonials';
import { Assessment } from '@/components/sections/Assessment';
import { Booking } from '@/components/sections/Booking';
import { Contact } from '@/components/sections/Contact';
import { Footer } from '@/components/sections/Footer';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main>
      <Header />
      <Hero />
      <BrandStrip />
      <TrustStrip />
      <Story />
      <Announcements />
      <Courses />
      <WhyUs />
      <Schedule />
      <WallOfWins />
      <Testimonials />
      <Assessment />
      <Booking />
      <Contact />
      <Footer />
    </main>
  );
}
