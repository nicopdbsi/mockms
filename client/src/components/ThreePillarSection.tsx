import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, ClipboardList, TrendingUp } from "lucide-react";

const pillars = [
  {
    icon: DollarSign,
    role: "CFO",
    title: "LAUNCH",
    subtitle: "Chief Financial Officer",
    description: "Turn recipes into profitable products through automated costing and pricing. Know your exact margins before you cook a single dish.",
  },
  {
    icon: ClipboardList,
    role: "COO",
    title: "MANAGE",
    subtitle: "Chief Operating Officer",
    description: "Manage recipes, ingredients, orders and inventory—so nothing gets wasted or forgotten. Stay organized and efficient every day.",
  },
  {
    icon: TrendingUp,
    role: "CGO",
    title: "GROW",
    subtitle: "Chief Growth Officer",
    description: "Shows what to sell, when to sell, and how much to produce—so you earn more with less guesswork. Data-driven decisions, real results.",
  },
];

export default function ThreePillarSection() {
  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-pillar-heading">
            Your Executive Team, Built In
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            BentoHub gives you three powerful roles working together to transform your kitchen into a profitable business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <Card
              key={index}
              className="hover-elevate active-elevate-2 transition-all duration-200"
              data-testid={`card-pillar-${pillar.title.toLowerCase()}`}
            >
              <CardContent className="p-8">
                <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 mb-6">
                  <pillar.icon className="w-8 h-8 text-primary" />
                </div>
                
                <div className="mb-2">
                  <span className="text-sm font-medium text-primary uppercase tracking-wide">
                    {pillar.role}
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold mb-2" data-testid={`text-pillar-title-${pillar.title.toLowerCase()}`}>
                  {pillar.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 font-medium">
                  {pillar.subtitle}
                </p>
                
                <p className="text-foreground/90 leading-relaxed">
                  {pillar.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
