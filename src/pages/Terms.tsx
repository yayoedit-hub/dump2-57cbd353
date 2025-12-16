import { Layout } from "@/components/layout/Layout";

export default function Terms() {
  return (
    <Layout>
      <div className="container py-16 md:py-24 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using Dump ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Dump is a platform that allows music producers ("Creators") to share unfinished music projects with subscribers. Subscribers pay a monthly fee to access a Creator's library of dump packs.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground">
              You must create an account to use certain features of the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Subscriptions and Payments</h2>
            <p className="text-muted-foreground">
              Subscriptions are billed monthly. You may cancel at any time, and your access will continue until the end of your billing period. Refunds are not provided for partial months.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Content and Licensing</h2>
            <p className="text-muted-foreground">
              Content uploaded by Creators remains their property. Subscribers receive a limited license to use downloaded content according to each Creator's specified license terms. Default license is personal use only.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Prohibited Conduct</h2>
            <p className="text-muted-foreground">
              You may not: redistribute downloaded content publicly, share your account credentials, upload content you don't have rights to, or use the Service for any illegal purpose.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate accounts that violate these terms. Creators may be removed for uploading content they don't have rights to share.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, please contact us at support@dump.app
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
