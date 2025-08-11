import { ArrowLeft, MessageCircle, Phone, Mail, Clock, HelpCircle, Headphones } from "lucide-react";
import { SiWhatsapp, SiTelegram, SiDiscord } from "react-icons/si";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Customer Support</h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">We're here to help you 24/7</p>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <SiWhatsapp className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">Chat with us instantly</p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <SiWhatsapp className="w-4 h-4 mr-2" />
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <SiTelegram className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Telegram</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">Join our support channel</p>
              <Button className="w-full bg-blue-500 hover:bg-blue-600">
                <SiTelegram className="w-4 h-4 mr-2" />
                Join Channel
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <SiDiscord className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Discord</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">Live gaming support</p>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                <SiDiscord className="w-4 h-4 mr-2" />
                Join Server
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Support Hours */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Support Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Live Chat Support</h4>
                <p className="text-gray-600 dark:text-gray-300">24/7 Available</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Phone Support</h4>
                <p className="text-gray-600 dark:text-gray-300">Saturday - Thursday: 9 AM - 11 PM (GMT+2)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="w-5 h-5 mr-2" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How do I get my game codes?</h4>
                <p className="text-gray-600 dark:text-gray-300">After successful payment, you'll receive your game codes instantly via email and SMS.</p>
              </div>
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">What payment methods do you accept?</h4>
                <p className="text-gray-600 dark:text-gray-300">We accept credit cards, mobile wallet, bank transfers, and cryptocurrency.</p>
              </div>
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Can I get a refund?</h4>
                <p className="text-gray-600 dark:text-gray-300">Refunds are available within 24 hours if the codes haven't been used.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How long does delivery take?</h4>
                <p className="text-gray-600 dark:text-gray-300">Most orders are delivered instantly. Some may take up to 5 minutes during peak hours.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Send us a message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your full name" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="your@email.com" />
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="How can we help you?" />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Describe your issue in detail..." rows={5} />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                <Mail className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}