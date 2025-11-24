import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DollarSign, TrendingUp, Users } from "lucide-react";
import testimonial1 from "@assets/generated_images/testimonial_customer_photo_one.png";
import testimonial2 from "@assets/generated_images/testimonial_customer_photo_two.png";
import testimonial3 from "@assets/generated_images/testimonial_customer_photo_three.png";

const stats = [
  {
    icon: DollarSign,
    value: "$2.4M+",
    label: "Revenue Managed",
  },
  {
    icon: TrendingUp,
    value: "34%",
    label: "Average Profit Increase",
  },
  {
    icon: Users,
    value: "500+",
    label: "Food Entrepreneurs",
  },
];

const testimonials = [
  {
    quote: "BentoHub helped me understand my true costs for the first time. I increased my prices by just 8% and my profit margins doubled. Game changer.",
    name: "Sarah Chen",
    business: "Sweet Harmony Bakery",
    location: "Portland, OR",
    image: testimonial1,
  },
  {
    quote: "I used to spend hours every week doing inventory and still ran out of ingredients. Now BentoHub handles it all automatically. I have my weekends back.",
    name: "Marcus Johnson",
    business: "Urban Sourdough Co.",
    location: "Austin, TX",
    image: testimonial2,
  },
  {
    quote: "The analytics showed me which products were actually making money. I cut three items and focused on my winners. Revenue up 40% in three months.",
    name: "Elena Rodriguez",
    business: "Dulce Vida Desserts",
    location: "Miami, FL",
    image: testimonial3,
  },
];

export default function SocialProofSection() {
  return (
    <section className="py-20 px-6 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-social-proof-heading">
            Real Results from Real Entrepreneurs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join hundreds of food entrepreneurs who've transformed their businesses with BentoHub.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {stats.map((stat, index) => (
            <Card key={index} data-testid={`card-stat-${index}`}>
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-5xl font-bold mb-2" data-testid={`text-stat-value-${index}`}>
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium" data-testid={`text-stat-label-${index}`}>
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} data-testid={`card-testimonial-${index}`}>
              <CardContent className="p-6">
                <p className="italic text-foreground/90 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={testimonial.image} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold" data-testid={`text-testimonial-name-${index}`}>
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.business}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
