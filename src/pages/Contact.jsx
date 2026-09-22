import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, MapPin, Phone, Mail } from "lucide-react";
import emailjs from "@emailjs/browser";
import { addInquiry, getPublishedProductBySlug } from "../lib/firestore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm = { name: "", email: "", phone: "", message: "" };

const NEXT_STEPS = [
  { step: "1", title: "You reach out", description: "Send your requirements through the form or call us directly." },
  { step: "2", title: "We assess your space", description: "Our team reviews the site and discusses design options with you." },
  { step: "3", title: "Get a quote", description: "You receive a clear, transparent quote -- no hidden costs." },
  { step: "4", title: "Design to install", description: "Once confirmed, we handle fabrication and on-site installation end to end." },
];

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState("");

  // "Get a Quote" on a product page links here as /contact?product=<slug>.
  const [searchParams, setSearchParams] = useSearchParams();
  const productSlug = searchParams.get("product");
  const [product, setProduct] = useState(null); // { slug, title } of a real, published product

  useEffect(() => {
    if (!productSlug) {
      setProduct(null);
      return undefined;
    }

    let cancelled = false;
    getPublishedProductBySlug(productSlug)
      .then((found) => {
        if (cancelled || !found) return;
        setProduct({ slug: found.slug, title: found.title });
        // Prefill the message, but never overwrite something the visitor already typed.
        setForm((prev) =>
          prev.message.trim()
            ? prev
            : { ...prev, message: `Hi, I'm interested in "${found.title}". Please share a quote.` }
        );
      })
      .catch(() => {
        // Not critical: the form still works as a normal contact form.
      });

    return () => {
      cancelled = true;
    };
  }, [productSlug]);

  function clearProduct() {
    setProduct(null);
    setSearchParams({}, { replace: true });
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_RE.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required.";
    if (!form.message.trim()) nextErrors.message = "Tell us a bit about your project.";
    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    setErrorMessage("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      message: form.message.trim(),
      ...(product ? { productSlug: product.slug, productTitle: product.title } : {}),
    };

    try {
      // Save to Firestore (existing behaviour, kept as a record/backup).
      await addInquiry(payload);

      // Send an email notification via EmailJS.
      // Send an email notification via EmailJS.
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: payload.name,
          from_email: payload.email,
          phone: payload.phone,
          message: payload.message,
          product: product?.title || "General enquiry",
          time: new Date().toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        },
        { publicKey: EMAILJS_PUBLIC_KEY }
      );

      setStatus("success");
      setForm(initialForm);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err?.text || err?.message || "Something went wrong sending your message. Please try again."
      );
    }
  }

  return (
    <main>
      {/* Hero */}
      <section className="bg-brand-navy">
        <div className="mx-auto max-w-container px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-gold-light">
              Get in Touch
            </p>
            <h1 className="mt-3 font-heading text-4xl font-semibold text-white sm:text-5xl">
              Let's Talk About Your Project
            </h1>
            <p className="mt-4 text-white/70">
              Tell us what you're building and we'll get back to you with next
              steps.
            </p>
          </div>
        </div>
      </section>

      {/* Info + Form */}
      <section className="mx-auto max-w-container px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Contact info */}
          <div className="lg:col-span-2">
            <h2 className="font-heading text-lg font-semibold text-brand-navy">
              Contact Details
            </h2>

            <dl className="mt-6 space-y-6 text-sm text-brand-ink/70">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-none text-brand-gold" strokeWidth={1.75} />
                <div>
                  <dt className="font-medium text-brand-navy">Address</dt>
                  <dd className="mt-1">F-144/C5, Khasra No. 1024, Fatehpur Beri Extn. New Delhi -110074</dd>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 flex-none text-brand-gold" strokeWidth={1.75} />
                <div>
                  <dt className="font-medium text-brand-navy">Phone</dt>
                  <dd className="mt-1">
                    <a href="tel:+919599145624" className="block hover:text-brand-gold">
                      +91 95991 45624
                    </a>
                    <a href="tel:+919999353943" className="block hover:text-brand-gold">
                      +91 99993 53943
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 flex-none text-brand-gold" strokeWidth={1.75} />
                <div>
                  <dt className="font-medium text-brand-navy">Email</dt>
                  <dd className="mt-1">
                    <a href="mailto:tensocraftdelhi@gmail.com" className="hover:text-brand-gold">
                      tensocraftdelhi@gmail.com
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 flex-none text-brand-gold" strokeWidth={1.75} />
                <div>
                  <dt className="font-medium text-brand-navy">Working Hours</dt>
                  <dd className="mt-1">Mon -- Sat, 10:00 AM -- 6:30 PM</dd>
                </div>
              </div>
            </dl>

            <div className="mt-8 rounded-xl border border-brand-navy/10 bg-brand-cream/60 p-5">
              <p className="text-sm font-medium text-brand-navy">
                Prefer a quick chat?
              </p>
              <p className="mt-1 text-sm text-brand-ink/60">
                Reach us directly on WhatsApp for a faster response.
              </p>
              <a
                href="https://wa.me/919599145624"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-gold hover:text-brand-navy"
              >
                Message on WhatsApp →
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="max-w-lg">
              {status === "success" ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-800">
                  <p className="font-semibold">Thanks -- your message is in.</p>
                  <p className="mt-1 text-sm">
                    We'll get back to you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="mt-4 text-sm font-semibold underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {product && (
                    <div className="flex items-center justify-between gap-4 rounded-lg border border-brand-gold/40 bg-brand-cream/60 px-4 py-3 text-sm">
                      <p className="text-brand-ink/70">
                        Enquiring about:{" "}
                        <span className="font-semibold text-brand-navy">{product.title}</span>
                      </p>
                      <button
                        type="button"
                        onClick={clearProduct}
                        className="flex-none text-xs font-semibold text-brand-ink/60 underline hover:text-brand-navy"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div>
                    <label htmlFor="name" className="text-sm font-medium text-brand-navy">
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-lg border border-brand-navy/20 px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="text-sm font-medium text-brand-navy">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-lg border border-brand-navy/20 px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="text-sm font-medium text-brand-navy">
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-lg border border-brand-navy/20 px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="message" className="text-sm font-medium text-brand-navy">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-lg border border-brand-navy/20 px-4 py-2.5 text-sm outline-none focus:border-brand-gold"
                    />
                    {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                  </div>

                  {status === "error" && (
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-navy transition-colors hover:bg-brand-gold-light disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "submitting" ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* What happens next */}
      <section className="border-t border-brand-ink/10 bg-brand-navy/[0.03] py-16">
        <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-gold">
            The Process
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold text-brand-navy sm:text-3xl">
            What Happens After You Reach Out
          </h2>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {NEXT_STEPS.map(({ step, title, description }) => (
              <div key={step}>
                <span className="font-heading text-3xl font-semibold text-brand-gold/40">
                  {step}
                </span>
                <h3 className="mt-2 font-heading text-base font-semibold text-brand-navy">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-ink/60">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Map -- full width, no container padding so it bleeds edge to edge */}
      <section className="w-full">
        <div className="aspect-[16/9] w-full sm:aspect-[16/5]">
          <iframe
            title="Tenso Craft location map"
            src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3507.815697284435!2d77.17507907549432!3d28.4549716757622!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjjCsDI3JzE3LjkiTiA3N8KwMTAnMzkuNiJF!5e0!3m2!1sen!2sin!4v1790077939473!5m2!1sen!2sin"
            className="h-full w-full border-0"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </section>
    </main>
  );
}