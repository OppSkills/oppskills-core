import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | OppSkills",
  description: "Terms of Use for OppSkills platform",
};

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-24 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Use</h1>
          <p className="text-muted-foreground text-lg">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p>
              Welcome to OppSkills ("we," "our," or "us"). These Terms of Use ("Terms") govern your access to and use
              of the OppSkills platform, including our website, mobile applications, and related services (collectively,
              the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
            </p>
            <p>
              If you do not agree to these Terms, please do not use our Service. We reserve the right to modify these
              Terms at any time, and such modifications will be effective immediately upon posting. Your continued use
              of the Service after any modifications indicates your acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p>
              OppSkills is a platform that connects participants with hackathons, competitions, events, and festivals.
              We provide tools for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Discovering and browsing hackathons, events, and competitions</li>
              <li>Registering for hackathons and events</li>
              <li>Forming and managing teams</li>
              <li>Submitting project entries and round submissions</li>
              <li>Processing payments for paid hackathons</li>
              <li>Organizing and managing hackathons and events (for organizers)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.1 Account Creation</h3>
            <p>To use certain features of our Service, you must create an account. You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.2 Account Eligibility</h3>
            <p>You must be at least 13 years old to create an account. By creating an account, you represent and warrant that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are at least 13 years of age</li>
              <li>You have the legal capacity to enter into these Terms</li>
              <li>You are not prohibited from using the Service under applicable laws</li>
              <li>All information you provide is truthful and accurate</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. User Conduct</h2>
            <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable local, state, national, or international law or regulation</li>
              <li>Infringe upon the rights of others, including intellectual property rights</li>
              <li>Transmit any harmful, offensive, or inappropriate content</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
              <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
              <li>Engage in any fraudulent, deceptive, or manipulative activity</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Collect or store personal data about other users without their consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Hackathons and Events</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.1 Participation</h3>
            <p>
              When you register for a hackathon or event, you agree to comply with all rules, guidelines, and
              requirements set by the organizer. OppSkills is not responsible for the content, conduct, or outcomes of
              any hackathon or event organized by third parties.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.2 Team Formation</h3>
            <p>
              You may form or join teams to participate in hackathons. You are responsible for your team's compliance
              with hackathon rules and our Terms. Team leaders have additional responsibilities for managing team
              members and submissions.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.3 Submissions</h3>
            <p>
              All submissions you make (including project entries, round submissions, and registration forms) must be
              your original work or work you have the right to submit. You grant organizers and OppSkills the right to
              use, display, and evaluate your submissions in connection with the hackathon or event.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Payments and Refunds</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">6.1 Payment Processing</h3>
            <p>
              Payments for paid hackathons are processed through Razorpay, our third-party payment processor. By
              making a payment, you agree to Razorpay's terms and conditions. OppSkills is not responsible for payment
              processing errors or issues.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">6.2 Refunds</h3>
            <p>
              Refund policies are determined by individual hackathon organizers. OppSkills facilitates refund requests
              but does not guarantee refunds. Refunds are subject to the organizer's policies and applicable payment
              processor terms.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">6.3 Organizer Payouts</h3>
            <p>
              Organizers may receive payouts for paid hackathons according to our payment terms. Payouts may be
              subject to holds, verification, and processing delays. Organizers are responsible for providing accurate
              payment information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Organizer Responsibilities</h2>
            <p>If you create hackathons or events as an organizer, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information about your hackathon or event</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Respect participants' rights and privacy</li>
              <li>Honor all commitments made to participants, including prizes and refunds</li>
              <li>Respond promptly to participant inquiries and concerns</li>
              <li>Maintain appropriate conduct and professionalism</li>
            </ul>
            <p className="mt-4">
              OppSkills reserves the right to review, modify, or remove any hackathon or event that violates these Terms
              or applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">8.1 Our Content</h3>
            <p>
              The Service, including its design, features, and content, is owned by OppSkills and protected by
              intellectual property laws. You may not copy, modify, distribute, or create derivative works without our
              express written permission.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">8.2 Your Content</h3>
            <p>
              You retain ownership of content you submit to the Service. By submitting content, you grant OppSkills a
              worldwide, non-exclusive, royalty-free license to use, display, and distribute your content in connection
              with the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
              IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Merchantability, fitness for a particular purpose, and non-infringement</li>
              <li>Accuracy, reliability, or completeness of information</li>
              <li>Uninterrupted or error-free operation</li>
              <li>Security or freedom from viruses or harmful components</li>
            </ul>
            <p className="mt-4">
              We do not endorse, guarantee, or assume responsibility for any hackathons, events, or content posted by
              organizers or users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, OPPSKILLS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY
              OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use or inability to use the Service</li>
              <li>Any conduct or content of third parties on the Service</li>
              <li>Unauthorized access to or alteration of your transmissions or data</li>
              <li>Any other matter relating to the Service</li>
            </ul>
            <p className="mt-4">
              Our total liability for any claims arising from or related to the Service shall not exceed the amount you
              paid to us in the 12 months preceding the claim, or $100, whichever is greater.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless OppSkills, its officers, directors, employees, and
              agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable
              attorneys' fees) arising out of or in any way connected with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your content or submissions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account and access to the Service at any time, with or
              without cause or notice, for any reason, including violation of these Terms. Upon termination, your right
              to use the Service will immediately cease.
            </p>
            <p className="mt-4">
              You may terminate your account at any time by contacting us at info@oppskills.com or through your account
              settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its
              conflict of law provisions. Any disputes arising from or relating to these Terms or the Service shall be
              subject to the exclusive jurisdiction of the courts in Greater Noida, Uttar Pradesh, India.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. Severability</h2>
            <p>
              If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining
              provisions shall continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">15. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and OppSkills
              regarding the Service and supersede all prior agreements and understandings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">16. Contact Information</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
            <div className="bg-muted/50 p-6 rounded-lg mt-4">
              <p className="mb-2">
                <strong>Email:</strong>{" "}
                <a href="mailto:info@oppskills.com" className="text-primary hover:underline">
                  info@oppskills.com
                </a>
              </p>
              <p>
                <strong>Address:</strong> Greater Noida, Uttar Pradesh 201310, India
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

