import { Navbar } from "@/components/Navbar"
import { Hero7 } from "@/components/Hero7"
import { Features } from "@/components/Features"
import { DetailedFeatures } from "@/components/DetailedFeatures"
import { HowItWorks } from "@/components/HowItWorks"
import { Pricing } from "@/components/Pricing"
import { Advantages } from "@/components/Advantages"

const Index = () => {
  return (
    <div className="min-h-screen w-full relative">
      {/* Radial Gradient Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #6366f1 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <main className="lg:mx-12">
          <Hero7
            heading="Проектируй инфраструктуру нового поколения"
            description="Мощный инструмент для проектирования дорог, сетей и гражданской инфраструктуры. Профессиональный CAD/BIM — без подписки и ограничений."
            button={{ text: "Попробовать бесплатно", url: "/login" }}
          />
          <Features />
          <HowItWorks />
          <DetailedFeatures />
          <Pricing />
        </main>
      </div>
    </div>
  )
}

export default Index