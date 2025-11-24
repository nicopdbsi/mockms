import { Check } from "lucide-react";
import recipeCostingImage from "@assets/generated_images/recipe_costing_dashboard_interface.png";
import inventoryImage from "@assets/generated_images/organized_kitchen_inventory_system.png";
import analyticsImage from "@assets/generated_images/growth_analytics_dashboard_view.png";

const features = [
  {
    title: "Automated Recipe Costing",
    description: "Know your exact costs and profit margins before you make a single dish. BentoHub automatically calculates ingredient costs, suggests optimal pricing, and shows you which recipes are most profitable.",
    image: recipeCostingImage,
    benefits: [
      "Instant cost breakdown for every recipe",
      "Smart pricing recommendations based on your target margins",
      "Track cost changes as ingredient prices fluctuate",
      "Compare profitability across your entire menu",
    ],
  },
  {
    title: "Intelligent Inventory Management",
    description: "Never run out of key ingredients or waste money on spoiled stock. Our system tracks usage, predicts needs, and alerts you when it's time to reorder.",
    image: inventoryImage,
    benefits: [
      "Real-time inventory tracking across all locations",
      "Automated low-stock alerts and reorder suggestions",
      "Reduce waste with expiration date monitoring",
      "Ingredient usage analytics to optimize ordering",
    ],
  },
  {
    title: "Growth Analytics & Insights",
    description: "Make data-driven decisions about what to produce and when. See which products are selling, identify trends, and forecast demand to maximize profits.",
    image: analyticsImage,
    benefits: [
      "Sales performance tracking by product and time period",
      "Demand forecasting based on historical data",
      "Customer preference insights and trends",
      "Production recommendations to minimize waste and maximize revenue",
    ],
  },
];

export default function FeatureDeepDiveSection() {
  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-features-heading">
            Everything You Need to Succeed
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed specifically for food entrepreneurs who want to scale profitably.
          </p>
        </div>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <div key={index} className="space-y-8" data-testid={`feature-${index}`}>
              <div className="aspect-video rounded-xl overflow-hidden bg-card">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover"
                  data-testid={`img-feature-${index}`}
                />
              </div>

              <div>
                <h3 className="text-3xl font-bold mb-4" data-testid={`text-feature-title-${index}`}>
                  {feature.title}
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  {feature.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <div
                      key={benefitIndex}
                      className="flex items-start gap-3"
                      data-testid={`text-benefit-${index}-${benefitIndex}`}
                    >
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <p className="text-foreground/90">{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
