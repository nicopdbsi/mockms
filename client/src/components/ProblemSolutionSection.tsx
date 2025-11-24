import { Check, X } from "lucide-react";
import kitchenImage from "@assets/generated_images/organized_kitchen_inventory_system.png";

const painPoints = [
  "Guessing at recipe costs and losing money",
  "Running out of ingredients at the worst times",
  "Wasting food because you made too much",
  "Not knowing which products actually make profit",
];

const solutions = [
  "Automated cost calculations for every recipe",
  "Real-time inventory tracking and alerts",
  "Data-driven production forecasts",
  "Clear profit margins on every product",
];

export default function ProblemSolutionSection() {
  return (
    <section className="py-20 px-6 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8" data-testid="text-problem-heading">
              The Guessing Game Stops Here
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Running a food business shouldn't feel like a constant gamble. These are the challenges that keep food entrepreneurs up at night:
            </p>
            <div className="space-y-4">
              {painPoints.map((point, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3"
                  data-testid={`text-pain-point-${index}`}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center mt-0.5">
                    <X className="w-4 h-4 text-destructive" />
                  </div>
                  <p className="text-foreground/90">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <img
              src={kitchenImage}
              alt="Organized kitchen workspace"
              className="rounded-xl w-full h-auto"
              data-testid="img-kitchen-workspace"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <img
              src={kitchenImage}
              alt="BentoHub solution in action"
              className="rounded-xl w-full h-auto"
              data-testid="img-solution-demo"
            />
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-4xl md:text-5xl font-bold mb-8" data-testid="text-solution-heading">
              Clarity, Control, Confidence
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              BentoHub replaces guesswork with data-driven decisions. Here's what you get:
            </p>
            <div className="space-y-4">
              {solutions.map((solution, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3"
                  data-testid={`text-solution-${index}`}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-foreground/90 font-medium">{solution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
