import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "@/lib/translation";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function FAQPage() {
  const { t } = useTranslation();
  const faqs = [
    {
      question: "How do I purchase game currency or gift cards?",
      answer: "Browse our games, select the package you want, add it to your cart, and proceed to checkout. You can pay via Vodafone Cash, Orange Cash, PayPal, or other available payment methods."
    },
    {
      question: "How long does delivery take?",
      answer: "Most digital products are delivered instantly after payment confirmation. For physical gift cards, delivery typically takes 1-3 business days."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay, InstaPay, Bank Transfer, and PayPal."
    },
    {
      question: "Is my payment information secure?",
      answer: "Yes, we use encrypted payment processing and never store your full payment details. All transactions are secure and protected."
    },
    {
      question: "Can I get a refund?",
      answer: "Refunds are available for unused products within 7 days of purchase. Please contact our support team for assistance."
    },
    {
      question: "What if I don't receive my order?",
      answer: "If you don't receive your order within the expected timeframe, please contact our 24/7 support team. We'll investigate and resolve the issue immediately."
    },
    {
      question: "Do you offer customer support?",
      answer: "Yes! We offer 24/7 customer support via live chat on our website or WhatsApp. Our team is always ready to help you."
    },
    {
      question: "Are your prices competitive?",
      answer: "Absolutely! We offer the best prices in the market with regular discounts and special offers. Check our website regularly for the latest deals."
    }
  ];

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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t("faq_title")}</h1>
            <LanguageSwitcher />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
            {t("faq_subtitle")}
          </p>

          <Card>
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-300">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t("still_have_questions")}
            </p>
            <Link href="/support">
              <Button className="bg-blue-600 hover:bg-blue-700">
                {t("contact_support")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

