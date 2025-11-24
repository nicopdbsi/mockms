import { Button } from "@/components/ui/button";
import { Check, Shield } from "lucide-react";

const benefits = [
  "Start with a 14-day free trial—no credit card required",
  "Full access to all features from day one",
  "Cancel anytime, no questions asked",
  "30-day money-back guarantee if you're not satisfied",
];

export default function CTASection() {
  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-cta-heading">
          Ready to Transform Your Kitchen?
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join the food entrepreneurs who've stopped guessing and started earning with BentoHub.
        </p>

        <div className="space-y-4 mb-10 text-left max-w-md mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start gap-3"
              data-testid={`text-cta-benefit-${index}`}
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <p className="text-foreground/90">{benefit}</p>
            </div>
          ))}
        </div>

        <Button
          size="lg"
          className="text-base px-10 py-6 h-auto mb-6"
          data-testid="button-cta-start-trial"
          onClick={() => console.log('Start Free Trial clicked')}
        >
          Start Your Free Trial Today
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span data-testid="text-guarantee">30-Day Money-Back Guarantee • No Credit Card Required</span>
        </div>
      </div>
    </section>
  );
}
