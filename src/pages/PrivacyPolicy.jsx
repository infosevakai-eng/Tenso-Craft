export default function PrivacyPolicy() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="font-heading text-4xl font-semibold text-brand-navy">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-brand-ink/50">
          Last updated: [add date before publishing]
        </p>

        <div className="mt-10 space-y-8 text-brand-ink/70">
          <p className="rounded-lg bg-brand-cream p-4 text-sm">
            This is a general-purpose draft based on what this website
            actually collects. It is not legal advice -- have it reviewed
            against India's Digital Personal Data Protection Act, 2023
            (and any other applicable law) before publishing.
          </p>

          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-navy">1. Information We Collect</h2>
            <p className="mt-2 leading-relaxed">
              When you submit our contact form, we collect your name, email
              address, phone number, and the message you send us. This
              information is stored securely and used only to respond to
              your enquiry.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-navy">2. How We Use Your Information</h2>
            <p className="mt-2 leading-relaxed">
              We use the details you submit solely to get in touch with you
              about your enquiry -- for quotes, project discussions, or
              general questions about our tensile structure solutions. We do
              not sell or rent your information to third parties.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-navy">3. How We Store Your Information</h2>
            <p className="mt-2 leading-relaxed">
              Contact form submissions are stored in our database (Google
              Firebase). Product and project photos on this site are hosted
              via Cloudinary and do not contain any personal information
              about visitors.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-navy">4. Cookies</h2>
            <p className="mt-2 leading-relaxed">
              This website does not currently use tracking or advertising
              cookies. If that changes in the future, this policy will be
              updated to reflect it.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-navy">5. Your Rights</h2>
            <p className="mt-2 leading-relaxed">
              You can request that we delete any information you've
              submitted to us by contacting us using the details on our{" "}
              <a href="/contact" className="text-brand-navy underline">Contact page</a>.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-navy">6. Contact Us</h2>
            <p className="mt-2 leading-relaxed">
              Questions about this policy can be sent to us via the{" "}
              <a href="/contact" className="text-brand-navy underline">Contact page</a>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}