import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RefundsPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Refund Policy</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <Card>
            <CardContent className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Eligibility for Refunds</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Refunds are available for unused digital products within 7 days of purchase. To be eligible for a refund:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                  <li>The product must not have been used, activated, or redeemed</li>
                  <li>The refund request must be made within 7 days of purchase</li>
                  <li>You must provide proof of purchase (order number or transaction ID)</li>
                  <li>The product must be in its original, unused condition</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Non-Refundable Items</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  The following items are not eligible for refunds:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                  <li>Products that have been used, activated, or redeemed</li>
                  <li>Products purchased more than 7 days ago</li>
                  <li>Special promotional items or limited-time offers</li>
                  <li>Products purchased during sales or clearance events (unless otherwise stated)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">How to Request a Refund</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  To request a refund, please follow these steps:
                </p>
                <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                  <li>Contact our support team via live chat or email at support@diaaeldeen.com</li>
                  <li>Provide your order number or transaction ID</li>
                  <li>Explain the reason for your refund request</li>
                  <li>Wait for our team to review and process your request (typically within 24-48 hours)</li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Refund Processing</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Once your refund is approved, it will be processed to your original payment method within 5-10 business days. 
                  The exact time depends on your payment provider. For bank transfers, it may take up to 14 business days.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Partial Refunds</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  In some cases, we may offer partial refunds if only part of your order is eligible for a refund. This will 
                  be determined on a case-by-case basis by our support team.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  If you have questions about our refund policy or need assistance with a refund request, please contact our 
                  support team at support@diaaeldeen.com or use our live chat feature.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

