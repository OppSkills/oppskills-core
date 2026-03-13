import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | OppSkills",
  description: "Privacy Policy for OppSkills platform",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-24 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p>
              Welcome to OppSkills ("we," "our," or "us"). We are committed to protecting your privacy and ensuring
              the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our platform to discover and participate in hackathons, events, and
              competitions.
            </p>
            <p>
              By using OppSkills, you agree to the collection and use of information in accordance with this policy. If
              you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.1 Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address (required)</li>
              <li>First name and last name (optional)</li>
              <li>Profile image URL (optional)</li>
              <li>Account access level</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.2 Onboarding Profile Information</h3>
            <p>During the onboarding process, we may collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Gender (optional)</li>
              <li>User category (school student, college student, working professional, fresher, etc.)</li>
              <li>Education details:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>School name, class, and address (for school students)</li>
                  <li>College/university information and current year</li>
                  <li>College passout year</li>
                </ul>
              </li>
              <li>Work details (for professionals):
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Company name</li>
                  <li>Job title</li>
                </ul>
              </li>
              <li>Location information (city, state, country)</li>
              <li>Interests and skills (arrays of strings)</li>
              <li>Experience level (beginner, intermediate, advanced, expert)</li>
              <li>Team preference (looking for team, have team, open to either, prefer solo)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.3 Registration and Participation Data</h3>
            <p>When you register for hackathons or events, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Registration form submissions and answers</li>
              <li>Team membership information</li>
              <li>Round submissions and qualifications</li>
              <li>Participation records</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.4 Payment Information</h3>
            <p>For paid hackathons, we process payments through Razorpay. We collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment transaction details</li>
              <li>Razorpay order and payment IDs</li>
              <li>Discount code redemptions</li>
              <li>Refund information (if applicable)</li>
            </ul>
            <p className="mt-2">
              <strong>Note:</strong> We do not store your full credit card or bank account details. Payment processing
              is handled securely by Razorpay, our payment service provider.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.5 Organizer Information</h3>
            <p>If you create hackathons or events as an organizer, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Razorpay Route account information (for receiving payouts)</li>
              <li>Bank account details (for manual payouts, if applicable)</li>
              <li>Organization name and logo</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.6 Usage Data</h3>
            <p>We automatically collect certain information when you use our platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Impressions and views of hackathons/events</li>
              <li>Registration counts</li>
              <li>IP address and browser information</li>
              <li>Device information</li>
              <li>Usage patterns and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Service Provision:</strong> To provide, maintain, and improve our platform and services
              </li>
              <li>
                <strong>Account Management:</strong> To create and manage your account, process registrations, and
                facilitate participation in hackathons and events
              </li>
              <li>
                <strong>Team Formation:</strong> To help you form teams, join teams, and collaborate with other
                participants
              </li>
              <li>
                <strong>Payment Processing:</strong> To process payments for paid hackathons, manage refunds, and
                facilitate payouts to organizers
              </li>
              <li>
                <strong>Communication:</strong> To send you notifications, updates, and important information about
                your registrations and participation
              </li>
              <li>
                <strong>Personalization:</strong> To personalize your experience and recommend relevant hackathons and
                events based on your interests and skills
              </li>
              <li>
                <strong>Analytics:</strong> To analyze usage patterns, improve our services, and conduct research
              </li>
              <li>
                <strong>Legal Compliance:</strong> To comply with legal obligations and enforce our terms of service
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Information Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.1 With Organizers</h3>
            <p>
              When you register for a hackathon or event, organizers may have access to your registration information,
              including your name, email, and submitted answers to registration forms.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.2 With Team Members</h3>
            <p>
              If you join a team, your team members and team leader will have access to your basic profile information
              and participation status.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.3 With Service Providers</h3>
            <p>We may share information with third-party service providers who assist us in:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment processing (Razorpay)</li>
              <li>Email delivery services</li>
              <li>Cloud hosting and storage</li>
              <li>Analytics and monitoring</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.4 Legal Requirements</h3>
            <p>
              We may disclose your information if required by law, court order, or government regulation, or to protect
              our rights, property, or safety, or that of our users.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.5 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the
              acquiring entity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information
              against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and authorization mechanisms</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and employee training</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive
              to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights and Choices</h2>
            <p>You have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Access:</strong> You can access and review your personal information through your account
                settings
              </li>
              <li>
                <strong>Correction:</strong> You can update or correct your information at any time through your profile
                settings
              </li>
              <li>
                <strong>Deletion:</strong> You can request deletion of your account and associated data by contacting us
                at info@oppskills.com
              </li>
              <li>
                <strong>Data Portability:</strong> You can request a copy of your data in a machine-readable format
              </li>
              <li>
                <strong>Opt-Out:</strong> You can opt out of certain communications by adjusting your notification
                preferences
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this
              Privacy Policy, unless a longer retention period is required or permitted by law. When you delete your
              account, we will delete or anonymize your personal information, except where we are required to retain it
              for legal, accounting, or regulatory purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Children's Privacy</h2>
            <p>
              Our platform is not intended for children under the age of 13. We do not knowingly collect personal
              information from children under 13. If you believe we have collected information from a child under 13,
              please contact us immediately, and we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence.
              These countries may have data protection laws that differ from those in your country. By using our
              services, you consent to the transfer of your information to these countries.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by
              posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to
              review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contact Us</h2>
            <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
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

