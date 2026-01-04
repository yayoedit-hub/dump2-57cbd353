import { Layout } from "@/components/layout/Layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is Dump?",
    answer: "Dump is a subscription platform where producers share their unfinished projects, stems, and MIDI files. Works with all DAWs including FL Studio, Ableton, Logic, and more. Subscribers get access to a creator's entire library of 'dump packs' – beats that didn't make the cut but are perfect for learning, flipping, or finishing."
  },
  {
    question: "What is a Dump Pack?",
    answer: "A Dump Pack is an upload from a creator containing unfinished music project files. Each pack includes at minimum a preview audio file (30-90 seconds) and can include: DAW project files, zipped projects (with all samples), optional stems (WAV audio files), and optional MIDI files."
  },
  {
    question: "Why do I need the desktop app to upload?",
    answer: "The Dump desktop app handles the complexity of packaging projects correctly. It automatically organizes your files, generates preview audio, extracts metadata like BPM and key, and ensures everything is properly formatted for subscribers to download and use."
  },
  {
    question: "What do subscriptions give me?",
    answer: "When you subscribe to a creator, you get unlimited access to their entire dump library (or back catalog, depending on their settings). You can preview any pack, download project files, stems, and MIDI, and get access to new uploads as long as your subscription is active."
  },
  {
    question: "Do I get commercial rights?",
    answer: "It depends on the creator's license settings. By default, dump packs are for personal use only. Some creators allow commercial use with credit. Always check the license type on a creator's profile before using their content commercially."
  },
  {
    question: "What DAWs are supported?",
    answer: "Dump supports all major DAWs! While project files are DAW-specific, stems (WAV) and MIDI files work universally. Creators can upload projects from FL Studio, Ableton Live, Logic Pro, and more."
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel anytime from your Subscriptions page. Your access continues until the end of your billing period. You won't be charged again after canceling."
  },
  {
    question: "How do creators get paid?",
    answer: "Creators receive a percentage of their subscription revenue. Payments are processed through Stripe and creators can set up their payout preferences in their settings."
  }
];

export default function FAQ() {
  return (
    <Layout>
      <div className="container py-16 md:py-24 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mb-12">
          Everything you need to know about Dump.
        </p>
        
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Layout>
  );
}
