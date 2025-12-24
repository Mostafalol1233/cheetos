import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <Card>
            <CardContent className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  We collect information that you provide directly to us, including your name, email address, phone number, 
                  and payment information when you make a purchase. We also collect information about your device and browsing 
                  behavior when you visit our website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  We use your information to process transactions, deliver products, communicate with you about your orders, 
                  improve our services, and send you promotional materials (with your consent).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Information Sharing</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  We do not sell your personal information. We may share your information with trusted service providers who 
                  assist us in operating our website and conducting business, as long as they agree to keep your information 
                  confidential.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Data Security</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  We implement appropriate security measures to protect your personal information. However, no method of 
                  transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Cookies</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can 
                  choose to disable cookies through your browser settings, though this may affect site functionality.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Your Rights</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  You have the right to access, update, or delete your personal information at any time. You can also opt-out 
                  of marketing communications by contacting us or using the unsubscribe link in our emails.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Children's Privacy</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Our services are not intended for children under 13 years of age. We do not knowingly collect personal 
                  information from children under 13.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Changes to This Policy</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
                  policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Contact Us</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  If you have questions about this Privacy Policy, please contact us at support@diaaeldeen.com or through 
                  our support page.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

