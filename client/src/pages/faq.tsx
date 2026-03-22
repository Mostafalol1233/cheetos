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
      question: t("faq_q1"),
      answer: t("faq_a1")
    },
    {
      question: t("faq_q2"),
      answer: t("faq_a2")
    },
    {
      question: t("faq_q3"),
      answer: t("faq_a3")
    },
    {
      question: t("faq_q4"),
      answer: t("faq_a4")
    },
    {
      question: t("faq_q5"),
      answer: t("faq_a5")
    },
    {
      question: t("faq_q6"),
      answer: t("faq_a6")
    },
    {
      question: t("faq_q7"),
      answer: t("faq_a7")
    },
    {
      question: t("faq_q8"),
      answer: t("faq_a8")
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

