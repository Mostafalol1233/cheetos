import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/translation";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function TermsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back_to_home")}
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t("terms_title")}</h1>
            <LanguageSwitcher />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-8">{t("last_updated")}: {new Date().toLocaleDateString()}</p>

          <Card>
            <CardContent className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  By accessing and using Diaa Eldeen's services, you accept and agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Services</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Diaa Eldeen provides digital gaming products including game currencies, gift cards, and related services. 
                  We reserve the right to modify, suspend, or discontinue any service at any time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Payment and Pricing</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  All prices are displayed in EGP (Egyptian Pounds) unless otherwise stated. Payment must be made in full 
                  before delivery. We accept various payment methods as listed on our website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Delivery</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Digital products are typically delivered instantly after payment confirmation. Delivery times may vary 
                  depending on the product and payment method. We are not responsible for delays caused by third-party services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Refunds and Cancellations</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Refunds are available for unused products within 7 days of purchase, subject to our refund policy. 
                  Once a product has been used or activated, it cannot be refunded.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. User Responsibilities</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  You are responsible for maintaining the confidentiality of your account information and for all activities 
                  that occur under your account. You agree to use our services only for lawful purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Limitation of Liability</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Diaa Eldeen shall not be liable for any indirect, incidental, special, or consequential damages arising 
                  from the use of our services. Our total liability shall not exceed the amount paid by you for the specific product.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Contact Information</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  For questions about these Terms of Service, please contact us at support@diaaeldeen.com or through our 
                  support page.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

