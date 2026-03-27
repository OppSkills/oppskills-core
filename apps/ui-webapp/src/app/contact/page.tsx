import PromoPoster from "@/components/landingpage/PromoPoster";
import ContactForm from "./_components/ContactForm";
import { CheckCircle2 } from "lucide-react";

export default function page() {
  return (
    <div className="py-8 lg:py-16 px-16 md:px-24 lg:px-12 xl:px-24 flex flex-col gap-16">
      <div className="flex flex-col-reverse lg:flex-row gap-16 lg:gap-8">
        <div className="flex flex-col gap-6 w-full lg:w-1/2">
          <div>
            <h2 className="text-4xl font-medium text-neutral-900">Talk To An OppSkills</h2>
            <h2 className="text-4xl font-medium text-neutral-900">Team Today</h2>
          </div>
          <p className="text-neutral-700 text-xl">
            Have a question or need help?<br />
            We’re here to assist you with events, registrations, opportunities,<br />
            and platform support.</p>
          <div className="flex flex-col gap-4">
            {
              [
                {
                  title: "Clear & Reliable Assistance",
                  description: "Get accurate information directly from the OppSkills team."
                },
                {
                  title: "Secure & Confidential",
                  description: "Your details and messages are protected and handled responsibly."
                },
                {
                  title: "Quick Support",
                  description: "We aim to respond as fast as possible so you’re never stuck."
                }
              ].map((e, i) => <div key={i} className="flex w-full gap-2">
                <div className="flex justify-center">
                  <CheckCircle2 className="text-primary-500 w-6 h-6" />
                </div>
                <div className="flex text-xl flex-col gap-1">
                  <h3 className="text-neutral-800 font-medium">{e.title}</h3>
                  <p className="text-neutral-700">{e.description}</p>
                </div>
              </div>)
            }
          </div>
        </div>
        <ContactForm />
      </div>
      <PromoPoster />
    </div>
  )
}
