import { Button } from "@/components/ui/button";
import { Play, Users } from "lucide-react";
import { useLocation } from "wouter";
import heroImage from "@assets/generated_images/hero_image_professional_entrepreneur.png";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import testimonial1 from "@assets/generated_images/testimonial_customer_photo_one.png";
import testimonial2 from "@assets/generated_images/testimonial_customer_photo_two.png";
import testimonial3 from "@assets/generated_images/testimonial_customer_photo_three.png";

export default function HeroSection() {
  const [, setLocation] = useLocation();
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/50"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
          STOP GUESSING.<br />START EARNING.
        </h1>
        
        <p className="text-lg md:text-xl text-white/90 mb-4 max-w-2xl mx-auto leading-relaxed">
          A subscription-based Kitchen Management System designed to help small food entrepreneurs LAUNCH, MANAGE, and GROW their food business with confidence.
        </p>

        <p className="text-base md:text-lg text-white/80 mb-10 max-w-2xl mx-auto">
          It's like having an executive team inside your kitchen—automating costs, managing inventory, and showing you exactly what to sell.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button
            size="lg"
            className="text-base px-8 py-6 h-auto"
            data-testid="button-start-trial"
            onClick={() => setLocation('/signup')}
          >
            Start Free Trial
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-base px-8 py-6 h-auto bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            data-testid="button-watch-demo"
            onClick={() => console.log('Watch Demo clicked')}
          >
            <Play className="w-5 h-5 mr-2" />
            Watch Demo
          </Button>
        </div>

        <div className="flex items-center justify-center gap-3 text-white/90">
          <div className="flex -space-x-2">
            <Avatar className="w-8 h-8 border-2 border-white">
              <AvatarImage src={testimonial1} alt="User 1" />
              <AvatarFallback>U1</AvatarFallback>
            </Avatar>
            <Avatar className="w-8 h-8 border-2 border-white">
              <AvatarImage src={testimonial2} alt="User 2" />
              <AvatarFallback>U2</AvatarFallback>
            </Avatar>
            <Avatar className="w-8 h-8 border-2 border-white">
              <AvatarImage src={testimonial3} alt="User 3" />
              <AvatarFallback>U3</AvatarFallback>
            </Avatar>
          </div>
          <p className="text-sm font-medium" data-testid="text-social-proof">
            Join 500+ food entrepreneurs
          </p>
        </div>
      </div>
    </section>
  );
}
