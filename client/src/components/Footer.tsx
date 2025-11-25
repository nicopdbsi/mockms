import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react";
import { useState } from "react";
import bentoLogo from "@assets/BentoHubLogo_1764103927788.png";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Demo", href: "#demo" },
    { label: "Integrations", href: "#integrations" },
  ],
  company: [
    { label: "About Us", href: "#about" },
    { label: "Blog", href: "#blog" },
    { label: "Careers", href: "#careers" },
    { label: "Contact", href: "#contact" },
  ],
  resources: [
    { label: "Help Center", href: "#help" },
    { label: "Community", href: "#community" },
    { label: "Terms of Service", href: "#terms" },
    { label: "Privacy Policy", href: "#privacy" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "#facebook", label: "Facebook" },
  { icon: Twitter, href: "#twitter", label: "Twitter" },
  { icon: Instagram, href: "#instagram", label: "Instagram" },
  { icon: Linkedin, href: "#linkedin", label: "LinkedIn" },
];

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter signup:', email);
    setEmail("");
  };

  return (
    <footer className="bg-card border-t border-card-border py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          <div className="lg:col-span-2">
            <div className="mb-4" data-testid="text-footer-logo">
              <img src={bentoLogo} alt="BentoHub Logo" className="h-8 w-auto" />
            </div>
            <p className="text-muted-foreground mb-6">
              Empowering food entrepreneurs to launch, manage, and grow profitable businesses with confidence.
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <label htmlFor="newsletter-email" className="text-sm font-medium block">
                Subscribe to our newsletter
              </label>
              <div className="flex gap-2">
                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  data-testid="input-newsletter-email"
                />
                <Button type="submit" data-testid="button-newsletter-submit">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-product-${index}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-company-${index}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`link-resources-${index}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-card-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-muted-foreground">
              © 2024 BentoHub. All rights reserved.
            </p>

            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover-elevate active-elevate-2 transition-colors"
                  data-testid={`link-social-${social.label.toLowerCase()}`}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
