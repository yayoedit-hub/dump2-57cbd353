import { Layout } from "@/components/layout/Layout";

export default function Privacy() {
  return (
    <Layout>
      <div className="container py-16 md:py-24 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide directly: email address, display name, and profile information. We also collect usage data including pages visited, features used, and interaction patterns.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use your information to: provide and maintain the Service, process subscriptions and payments, send service-related communications, and improve our platform.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Payment Information</h2>
            <p className="text-muted-foreground">
              Payment processing is handled by Stripe. We do not store your credit card details. Stripe's privacy policy governs how they handle your payment information.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage</h2>
            <p className="text-muted-foreground">
              Your data is stored securely using industry-standard encryption. Uploaded content is stored in secure cloud storage with access controls to ensure only authorized users can download content.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information. We may share data with service providers who assist in operating our platform (hosting, analytics, payment processing).
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground">
              You have the right to: access your personal data, request correction of inaccurate data, request deletion of your account and data, and export your data.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Cookies</h2>
            <p className="text-muted-foreground">
              We use cookies for authentication and to remember your preferences. You can control cookies through your browser settings, but disabling them may affect functionality.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact</h2>
            <p className="text-muted-foreground">
              For privacy-related inquiries, please contact us at privacy@dump.app
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
